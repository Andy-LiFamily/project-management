<template>
  <div class="project-page">
    <h2>项目管理</h2>
    <el-button type="primary" @click="handleAdd">新建项目</el-button>
    
    <el-table :data="projects" border style="margin-top:20px" @expand-change="handleExpand">
      <el-table-column type="expand" width="50">
        <template #default="{ row }">
          <div class="feature-expand">
            <el-tabs>
              <el-tab-pane label="软件功能">
                <el-button size="small" type="primary" @click="goToFeature(row, 'software')" style="margin-bottom:10px">新增功能</el-button>
                <el-table :data="getFeatures(row.f_id, 'software')" size="small">
                  <el-table-column prop="f_feature_name" label="功能名称" width="150" />
                  <el-table-column prop="f_purpose" label="目的" show-overflow-tooltip />
                  <el-table-column prop="f_owner_name" label="负责人" width="100" />
                  <el-table-column prop="f_create_date" label="创建日期" width="100" />
                  <el-table-column prop="f_target_date" label="预计完成日期" width="120" />
                  <el-table-column label="状态" width="80">
                    <template #default="{ row }">
                      <el-tag :type="getStatusType(row.f_status)">{{ row.f_status }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="分工数" width="80">
                    <template #default="{ row }">{{ getTaskCount(row.f_id) }}</template>
                  </el-table-column>
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <div class="action-buttons">
                        <el-button size="small" @click="editFeature(row)">编辑</el-button>
                        <el-button size="small" type="primary" @click="viewTasks(row)">分工</el-button>
                        <el-button size="small" type="primary" @click="addTask(row)">新增</el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
              <el-tab-pane label="硬件功能">
                <el-button size="small" type="primary" @click="goToFeature(row, 'hardware')" style="margin-bottom:10px">新增功能</el-button>
                <el-table :data="getFeatures(row.f_id, 'hardware')" size="small">
                  <el-table-column prop="f_feature_name" label="功能名称" width="150" />
                  <el-table-column prop="f_purpose" label="目的" show-overflow-tooltip />
                  <el-table-column prop="f_owner_name" label="负责人" width="100" />
                  <el-table-column prop="f_create_date" label="创建日期" width="100" />
                  <el-table-column prop="f_target_date" label="预计完成日期" width="120" />
                  <el-table-column label="状态" width="80">
                    <template #default="{ row }">
                      <el-tag :type="getStatusType(row.f_status)">{{ row.f_status }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="分工数" width="80">
                    <template #default="{ row }">{{ getTaskCount(row.f_id) }}</template>
                  </el-table-column>
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <div class="action-buttons">
                        <el-button size="small" @click="editFeature(row)">编辑</el-button>
                        <el-button size="small" type="primary" @click="viewTasks(row)">分工</el-button>
                        <el-button size="small" type="primary" @click="addTask(row)">新增</el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
            </el-tabs>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="f_project_name" label="项目名称" />
      <el-table-column prop="f_description" label="描述" show-overflow-tooltip />
      <el-table-column prop="f_target_date" label="预计完成日期" width="120" />
      <el-table-column prop="f_create_user" label="创建人" width="100">
        <template #default="{ row }">{{ row.f_create_user || '-' }}</template>
      </el-table-column>
      <el-table-column prop="f_create_time" label="创建时间" width="120">
        <template #default="{ row }">{{ formatDate(row.f_create_time) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="primary" @click="viewFeatures(row, 'software')">软件</el-button>
            <el-button size="small" type="success" @click="viewFeatures(row, 'hardware')">硬件</el-button>
            <el-button size="small" type="danger" v-if="isAdmin" @click="handleDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 项目编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑项目' : '新建项目'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="form.projectName" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="预计完成日期">
          <el-date-picker v-model="form.targetDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 功能编辑弹窗 -->
    <el-dialog v-model="featureDialogVisible" title="编辑功能" width="600px">
      <el-form :model="featureForm" label-width="100px">
        <el-form-item label="功能名称">
          <el-input v-model="featureForm.featureName" />
        </el-form-item>
        <el-form-item label="目的">
          <el-input v-model="featureForm.purpose" type="textarea" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="featureForm.ownerId" @change="onOwnerChange">
            <el-option v-for="u in users" :key="u.f_id" :label="u.f_user_name" :value="u.f_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建日期">
          <el-date-picker v-model="featureForm.createDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="预计完成日期">
          <el-date-picker v-model="featureForm.targetDate" type="date" value-format="YYYY-MM-DD" placeholder="选择预计完成日期" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="featureForm.supplierId" placeholder="选择供应商">
            <el-option v-for="s in suppliers" :key="s.f_id" :label="s.f_supplier_name" :value="s.f_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="featureForm.status" @change="onStatusChange">
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="进行中" />
            <el-option label="完成" value="完成" :disabled="!featureForm.summary && featureForm.status !== '完成'" />
            <el-option label="延误" value="延误" />
          </el-select>
        </el-form-item>
        <el-form-item label="总结" v-if="isFeatureEdit">
          <el-input v-model="featureForm.summary" type="textarea" :rows="3" placeholder="填写总结后才能标记为完成" />
        </el-form-item>
        <el-form-item label="规划文档">
          <el-upload 
            :action="uploadUrl" 
            :headers="uploadHeaders" 
            :on-success="onUploadSuccess" 
            :on-error="onUploadError"
            name="document"
            :show-file-list="false">
            <el-button>上传文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="已上传文件" v-if="uploadedFiles.length > 0">
          <el-table :data="uploadedFiles" size="small" border>
            <el-table-column prop="fileName" label="文件名" />
            <el-table-column label="操作" width="150">
              <template #default="{ $index, row }">
                <div class="action-buttons">
                  <el-button size="small" type="primary" @click="downloadFile(row.path)">下载</el-button>
                  <el-button size="small" type="danger" @click="removeFile($index)" v-if="isAdmin">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="featureDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteFeature" v-if="isAdmin">删除</el-button>
        <el-button type="primary" @click="submitFeature">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分工列表弹窗 -->
    <el-dialog v-model="taskListVisible" title="工作分工列表" width="900px">
      <el-table :data="featureTasks" border>
        <el-table-column prop="f_task_content" label="工作内容" />
        <el-table-column prop="f_target_date" label="预计完工日期" width="120" />
        <el-table-column prop="f_owner_name" label="负责人" width="100" />
        <el-table-column prop="f_progress" label="进度%" width="80" />
        <el-table-column prop="f_supplier_name" label="供应商" width="120" />
        <el-table-column prop="f_status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusType(row.f_status)">{{ row.f_status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" @click="editTask(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteTask(row)" v-if="isAdmin">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 分工弹窗 -->
    <el-dialog v-model="taskDialogVisible" :title="isTaskEdit ? '编辑分工' : '新增分工'" width="600px">
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="工作内容">
          <el-input v-model="taskForm.taskContent" type="textarea" />
        </el-form-item>
        <el-form-item label="预计完工日期">
          <el-date-picker v-model="taskForm.targetDate" type="date" value-format="YYYY-MM-DD" placeholder="选择预计完工日期" style="width:100%" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="taskForm.ownerId" @change="onTaskOwnerChange">
            <el-option v-for="u in users" :key="u.f_id" :label="u.f_user_name" :value="u.f_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="taskForm.supplierId">
            <el-option v-for="s in suppliers" :key="s.f_id" :label="s.f_supplier_name" :value="s.f_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="taskForm.status">
            <el-option label="未开展" value="未开展" />
            <el-option label="进行中" value="进行中" />
            <el-option label="延误" value="延误" />
            <el-option label="完成" value="完成" />
          </el-select>
        </el-form-item>
        <el-form-item label="进度%">
          <el-input-number v-model="taskForm.progress" :min="0" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTask">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
const API_URL = import.meta.env.PROD ? 'https://pm-backend.zeabur.app' + '/api/pm' : import.meta.env.VITE_API_URL || '/api/pm';
const uploadUrl = API_URL + '/feature/upload'
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const projects = ref([])
const features = ref([])
const tasks = ref([])
const users = ref([])
const suppliers = ref([])
const dialogVisible = ref(false)
const featureDialogVisible = ref(false)
const taskDialogVisible = ref(false)
const taskListVisible = ref(false)
const featureTasks = ref([])
const isEdit = ref(false)
const isTaskEdit = ref(false)
const form = ref({ projectName: '', description: '', targetDate: '' })
const featureForm = ref({ id: null, featureName: '', purpose: '', ownerId: null, ownerName: '', createDate: '', targetDate: '', supplierId: null, status: 'pending', summary: '', documentPath: '' })
const uploadedFiles = ref([])
const isFeatureEdit = ref(false)
const taskForm = ref({ id: null, featureId: null, taskContent: '', targetDate: '', ownerId: null, ownerName: '', supplierId: null, status: '未开展', progress: 0 })
const currentFeatureId = ref(null)

const user = JSON.parse(localStorage.getItem('pm_user') || '{}')
const isAdmin = computed(() => user.role === 'admin')

const fetchData = async () => {
  try {
    const res = await fetch(API_URL + '/project', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) projects.value = data.data
  } catch (e) { console.error(e) }
}

const fetchAllFeatures = async () => {
  try {
    const res = await fetch(API_URL + '/feature', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) features.value = data.data
  } catch (e) { console.error(e) }
}

const fetchAllTasks = async () => {
  try {
    const res = await fetch(API_URL + '/task', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) tasks.value = data.data
  } catch (e) { console.error(e) }
}

const fetchUsers = async () => {
  try {
    const res = await fetch(API_URL + '/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) users.value = data.data
  } catch (e) { console.error(e) }
}

const fetchSuppliers = async () => {
  try {
    const res = await fetch(API_URL + '/supplier', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) suppliers.value = data.data
  } catch (e) { console.error(e) }
}

const getFeatures = (projectId, branch) => {
  return features.value.filter(f => f.f_project_id === projectId && f.f_branch === branch)
}

const getTaskCount = (featureId) => {
  return tasks.value.filter(t => t.f_feature_id === featureId).length
}

const getStatusType = (status) => {
  const map = { pending: 'info', 进行中: 'warning', 完成: 'success', 延误: 'danger' }
  return map[status] || 'info'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    return dateStr.split('T')[0]
  }
  return dateStr
}

const handleExpand = () => {
  fetchAllFeatures()
  fetchAllTasks()
}

const handleAdd = () => {
  form.value = { projectName: '', description: '', targetDate: '' }
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row) => {
  form.value = { 
    id: row.f_id,
    projectName: row.f_project_name, 
    description: row.f_description, 
    targetDate: row.f_target_date || '' 
  }
  isEdit.value = true
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.projectName) {
    ElMessage.warning('请输入项目名称')
    return
  }
  try {
    let res
    if (isEdit.value) {
      res = await fetch(API_URL + '/project/' + form.value.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('pm_token')}` },
        body: JSON.stringify(form.value)
      })
    } else {
      res = await fetch(API_URL + '/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('pm_token')}` },
        body: JSON.stringify({ ...form.value, createUser: user.userName || user.userId })
      })
    }
    const data = await res.json()
    if (data.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchData()
    }
  } catch (e) { ElMessage.error('操作失败') }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除此项目？', '警告', { type: 'warning' }).then(async () => {
    try {
      const res = await fetch(API_URL + '/project/' + row.f_id, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
      })
      const data = await res.json()
      if (data.code === 200) {
        ElMessage.success('删除成功')
        fetchData()
      }
    } catch (e) { ElMessage.error('删除失败') }
  }).catch(() => {})
}

const viewFeatures = (project, branch) => {
  router.push(`/feature/${project.f_id}/${branch}`)
}

const goToFeature = (project, branch) => {
  router.push(`/feature/${project.f_id}/${branch}`)
}

// Feature edit functions
const editFeature = (row) => {
  const docPath = row.f_document_path || ''
  uploadedFiles.value = docPath ? docPath.split(',').filter(p => p).map(p => ({ fileName: p.split('/').pop(), path: p })) : []
  featureForm.value = { 
    id: row.f_id,
    featureName: row.f_feature_name, 
    purpose: row.f_purpose, 
    ownerId: row.f_owner_id, 
    ownerName: row.f_owner_name, 
    createDate: row.f_create_date, 
    targetDate: row.f_target_date || '',
    supplierId: row.f_supplier_id || null,
    status: row.f_status || 'pending',
    summary: row.f_summary || '',
    documentPath: docPath
  }
  isFeatureEdit.value = true
  featureDialogVisible.value = true
}

const onOwnerChange = (val) => {
  const u = users.value.find(u => u.f_id === val)
  if (u) featureForm.value.ownerName = u.f_user_name
}

const onStatusChange = (val) => {
  if (val === '完成' && !featureForm.value.summary) {
    ElMessage.warning('请先填写总结才能标记为完成')
    featureForm.value.status = '进行中'
  }
}

const onUploadSuccess = (response, file, fileList) => {
  console.log('Upload response:', response)
  if (response && response.code === 200) {
    const filePath = response.data || response.message
    if (filePath) {
      const fileName = filePath.split('/').pop()
      uploadedFiles.value.push({ fileName: fileName, path: filePath })
      featureForm.value.documentPath = uploadedFiles.value.map(f => f.path).join(',')
      ElMessage.success('上传成功: ' + fileName)
    }
  } else {
    ElMessage.error('上传失败: ' + (response?.message || '未知错误'))
  }
}

const onUploadError = (err, file, fileList) => {
  console.error('Upload error:', err)
  ElMessage.error('上传失败')
}

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1)
  featureForm.value.documentPath = uploadedFiles.value.map(f => f.path).join(',')
}

const downloadFile = (filePath) => {
  if (filePath) {
    const url = 'https://pm-backend.zeabur.app' + filePath
    window.open(url, '_blank')
  }
}

const submitFeature = async () => {
  if (!featureForm.value.featureName) {
    ElMessage.warning('请输入功能名称')
    return
  }
  if (!featureForm.value.id) {
    ElMessage.warning('功能ID错误')
    return
  }
  try {
    // Clean up data - convert undefined/empty strings to null
    const cleanData = {}
    for (const [key, value] of Object.entries(featureForm.value)) {
      cleanData[key] = (value === '' || value === undefined || value === null) ? null : value
    }
    
    const res = await fetch(API_URL + '/feature/' + featureForm.value.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('pm_token')}` },
      body: JSON.stringify(cleanData)
    })
    const data = await res.json()
    if (data.code === 200) {
      ElMessage.success('更新成功')
      featureDialogVisible.value = false
      fetchAllFeatures()
    } else {
      ElMessage.error(data.message || '更新失败')
    }
  } catch (e) { 
    console.error(e)
    ElMessage.error('更新失败: ' + e.message) 
  }
}

const deleteFeature = () => {
  ElMessageBox.confirm('确认删除此功能？删除后无法恢复！', '警告', { type: 'warning' }).then(async () => {
    try {
      const res = await fetch(API_URL + '/feature/' + featureForm.value.f_id, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
      })
      const data = await res.json()
      if (data.code === 200) {
        ElMessage.success('删除成功')
        featureDialogVisible.value = false
        fetchAllFeatures()
      } else {
        ElMessage.error(data.message || '删除失败')
      }
    } catch (e) { 
      console.error(e)
      ElMessage.error('删除失败') 
    }
  }).catch(() => {})
}

// Task functions
const viewTasks = async (row) => {
  currentFeatureId.value = row.f_id
  try {
    const res = await fetch(API_URL + '/task?featureId=' + row.f_id, {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) {
      featureTasks.value = data.data
      taskListVisible.value = true
    }
  } catch (e) { console.error(e) }
}

const editTask = (row) => {
  taskForm.value = {
    id: row.f_id,
    featureId: row.f_feature_id,
    taskContent: row.f_task_content,
    targetDate: row.f_target_date,
    ownerId: row.f_owner_id,
    ownerName: row.f_owner_name,
    supplierId: row.f_supplier_id,
    status: row.f_status,
    progress: row.f_progress
  }
  isTaskEdit.value = true
  taskListVisible.value = false
  taskDialogVisible.value = true
}

const deleteTask = (row) => {
  // Validate f_id exists
  if (!row.f_id || row.f_id === 'undefined') {
    ElMessage.error('分工ID无效，无法删除')
    return
  }
  ElMessageBox.confirm('确认删除此分工？', '警告', { type: 'warning' }).then(async () => {
    try {
      const res = await fetch(API_URL + '/task/' + row.f_id, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
      })
      const data = await res.json()
      if (data.code === 200) {
        ElMessage.success('删除成功')
        // Refresh task list - use f_feature_id if available
        if (row.f_feature_id) {
          viewTasks({ f_id: row.f_feature_id })
        } else if (currentFeatureId.value) {
          viewTasks({ f_id: currentFeatureId.value })
        } else {
          fetchAllTasks()
        }
      } else {
        ElMessage.error(data.message || '删除失败')
      }
    } catch (e) { 
      console.error(e)
      ElMessage.error('删除失败') 
    }
  }).catch(() => {})
}

const getTaskStatusType = (status) => {
  const map = { '未开展': 'info', '进行中': 'warning', '完成': 'success', '延误': 'danger' }
  return map[status] || 'info'
}

const addTask = (row) => {
  taskForm.value = { 
    id: null,
    featureId: row.f_id,
    taskContent: '', 
    targetDate: '', 
    ownerId: null, 
    ownerName: '', 
    supplierId: null, 
    status: '未开展', 
    progress: 0 
  }
  isTaskEdit.value = false
  taskDialogVisible.value = true
}

const onTaskOwnerChange = (val) => {
  const u = users.value.find(u => u.f_id === val)
  if (u) taskForm.value.ownerName = u.f_user_name
}

const submitTask = async () => {
  if (!taskForm.value.taskContent) {
    ElMessage.warning('请输入工作内容')
    return
  }
  try {
    // Clean up data
    const cleanData = {}
    for (const [key, value] of Object.entries(taskForm.value)) {
      cleanData[key] = (value === '' || value === undefined || value === null) ? null : value
    }
    
    const url = isTaskEdit.value && taskForm.value.id 
      ? API_URL + '/task/' + taskForm.value.id 
      : API_URL + '/task'
    const method = isTaskEdit.value && taskForm.value.id ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('pm_token')}` },
      body: JSON.stringify(cleanData)
    })
    const data = await res.json()
    if (data.code === 200) {
      ElMessage.success(isTaskEdit.value ? '更新成功' : '创建成功')
      taskDialogVisible.value = false
      fetchAllTasks()
    } else {
      ElMessage.error(data.message || '操作失败')
    }
  } catch (e) { 
    console.error(e)
    ElMessage.error('操作失败') 
  }
}

onMounted(() => { fetchData(); fetchAllFeatures(); fetchAllTasks(); fetchUsers(); fetchSuppliers() })
</script>

<style scoped>
.project-page h2 { margin-bottom: 20px; }
.feature-expand { padding: 10px 20px; }
.action-buttons { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
</style>
