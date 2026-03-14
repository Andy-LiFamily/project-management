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
                      <el-button size="small" @click="editFeature(row)">编辑</el-button>
                      <el-button size="small" type="primary" @click="addTask(row)">分工</el-button>
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
                      <el-button size="small" @click="editFeature(row)">编辑</el-button>
                      <el-button size="small" type="primary" @click="addTask(row)">分工</el-button>
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
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="primary" @click="viewFeatures(row, 'software')">软件</el-button>
          <el-button size="small" type="success" @click="viewFeatures(row, 'hardware')">硬件</el-button>
          <el-button size="small" type="danger" v-if="isAdmin" @click="handleDelete(row)">删除</el-button>
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
        <el-form-item label="状态">
          <el-select v-model="featureForm.status">
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="进行中" />
            <el-option label="完成" value="完成" />
            <el-option label="延误" value="延误" />
          </el-select>
        </el-form-item>
        <el-form-item label="规划文档">
          <el-upload :action="uploadUrl" :headers="uploadHeaders" :on-success="onUploadSuccess">
            <el-button>上传文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="featureDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFeature">确定</el-button>
      </template>
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
const uploadUrl = API_URL + '/feature'
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
const isEdit = ref(false)
const isTaskEdit = ref(false)
const form = ref({ projectName: '', description: '', targetDate: '' })
const featureForm = ref({ id: null, featureName: '', purpose: '', ownerId: null, ownerName: '', createDate: '', targetDate: '', status: 'pending', documentPath: '' })
const taskForm = ref({ id: null, featureId: null, taskContent: '', targetDate: '', ownerId: null, ownerName: '', supplierId: null, status: '未开展', progress: 0 })

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
  featureForm.value = { 
    id: row.f_id,
    featureName: row.f_feature_name, 
    purpose: row.f_purpose, 
    ownerId: row.f_owner_id, 
    ownerName: row.f_owner_name, 
    createDate: row.f_create_date, 
    targetDate: row.f_target_date || '',
    status: row.f_status || 'pending',
    documentPath: row.f_document_path || ''
  }
  featureDialogVisible.value = true
}

const onOwnerChange = (val) => {
  const u = users.value.find(u => u.f_id === val)
  if (u) featureForm.value.ownerName = u.f_user_name
}

const onUploadSuccess = (res) => {
  if (res.code === 200) featureForm.value.documentPath = res.data
  ElMessage.success('上传成功')
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
    const res = await fetch(API_URL + '/feature/' + featureForm.value.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('pm_token')}` },
      body: JSON.stringify(featureForm.value)
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

// Task functions
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
    const res = await fetch(API_URL + '/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('pm_token')}` },
      body: JSON.stringify(taskForm.value)
    })
    const data = await res.json()
    if (data.code === 200) {
      ElMessage.success(isTaskEdit.value ? '更新成功' : '创建成功')
      taskDialogVisible.value = false
      fetchAllTasks()
    }
  } catch (e) { ElMessage.error('操作失败') }
}

onMounted(() => { fetchData(); fetchAllFeatures(); fetchAllTasks(); fetchUsers(); fetchSuppliers() })
</script>

<style scoped>
.project-page h2 { margin-bottom: 20px; }
.feature-expand { padding: 10px 20px; }
</style>
