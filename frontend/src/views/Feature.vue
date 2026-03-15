<template>
  <div class="feature-page">
    <div class="header">
      <el-button @click="$router.back()">返回</el-button>
      <h3>{{ branchName }} - 功能列表</h3>
    </div>
    
    <el-button type="primary" @click="handleAddFeature">新增功能</el-button>
    
    <el-table :data="features" border style="margin-top:20px" @row-click="showTasks">
      <el-table-column prop="f_feature_name" label="功能名称" />
      <el-table-column prop="f_purpose" label="目的" show-overflow-tooltip />
      <el-table-column prop="f_owner_name" label="负责人" />
      <el-table-column prop="f_create_date" label="创建日期" />
      <el-table-column prop="f_status" label="状态">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.f_status)">{{ row.f_status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click.stop="editFeature(row)">编辑</el-button>
          <el-button size="small" type="danger" v-if="isAdmin" @click.stop="deleteFeature(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 弹窗：功能表单 -->
    <el-dialog v-model="featureDialogVisible" :title="isFeatureEdit ? '编辑功能' : '新增功能'" width="600px">
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
        <el-form-item label="规划文档">
          <el-upload :action="uploadUrl" :headers="uploadHeaders" :on-success="onUploadSuccess" :show-file-list="false">
            <el-button>上传文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="已上传文件" v-if="uploadedFiles.length > 0">
          <el-table :data="uploadedFiles" size="small" border>
            <el-table-column prop="fileName" label="文件名" />
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button size="small" type="danger" @click="removeFile($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="featureDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFeature">确定</el-button>
      </template>
    </el-dialog>

    <!-- 弹窗：分工列表 -->
    <el-dialog v-model="taskDialogVisible" title="工作分工" width="900px">
      <el-button type="primary" @click="handleAddTask">新增分工</el-button>
      
      <el-table :data="tasks" border style="margin-top:15px">
        <el-table-column prop="f_task_content" label="工作内容" />
        <el-table-column prop="f_target_date" label="目标日期" />
        <el-table-column prop="f_owner_name" label="负责人" />
        <el-table-column prop="f_progress" label="进度%" width="80" />
        <el-table-column prop="f_supplier_name" label="供应商" />
        <el-table-column prop="f_status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusType(row.f_status)">{{ row.f_status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="editTask(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 完成功能 -->
      <el-divider />
      <el-form v-if="currentFeature" :model="summaryForm" label-width="100px">
        <el-form-item label="总结">
          <el-input v-model="summaryForm.summary" type="textarea" :rows="3" placeholder="请填写功能完成总结" />
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="completeFeature">完成功能</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 弹窗：分工表单 -->
    <el-dialog v-model="taskFormVisible" :title="isTaskEdit ? '编辑分工' : '新增分工'" width="600px">
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="工作内容">
          <el-input v-model="taskForm.taskContent" type="textarea" />
        </el-form-item>
        <el-form-item label="目标日期">
          <el-date-picker v-model="taskForm.targetDate" type="date" value-format="YYYY-MM-DD" />
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
        <el-form-item label="文档">
          <el-upload :action="uploadUrl" :headers="uploadHeaders" :on-success="onTaskUploadSuccess">
            <el-button>上传文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTask">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
const API_URL = import.meta.env.PROD ? 'https://pm-backend.zeabur.app' + '/api/pm' : import.meta.env.VITE_API_URL || '/api/pm';
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const projectId = route.params.projectId
const branch = route.params.branch
const branchName = computed(() => branch === 'software' ? '软件' : '硬件')

const features = ref([])
const tasks = ref([])
const users = ref([])
const suppliers = ref([])
const currentFeature = ref(null)
const featureDialogVisible = ref(false)
const taskDialogVisible = ref(false)
const taskFormVisible = ref(false)
const isFeatureEdit = ref(false)
const isTaskEdit = ref(false)
const uploadUrl = '/api/pm/feature'
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }

const featureForm = ref({ featureName: '', purpose: '', ownerId: null, ownerName: '', createDate: '', targetDate: '', documentPath: '' })
const uploadedFiles = ref([])
const taskForm = ref({ taskContent: '', targetDate: '', ownerId: null, ownerName: '', supplierId: null, status: '未开展', progress: 0, documentPath: '' })
const summaryForm = ref({ summary: '' })

const user = JSON.parse(localStorage.getItem('pm_user') || '{}')
const isAdmin = computed(() => user.role === 'admin')

const fetchFeatures = async () => {
  try {
    const res = await fetch(`/api/pm/feature?projectId=${projectId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) {
      features.value = data.data.filter(f => f.f_branch === branch)
    }
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

const fetchTasks = async (featureId) => {
  try {
    const res = await fetch(`/api/pm/task?featureId=${featureId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) tasks.value = data.data
  } catch (e) { console.error(e) }
}

const getStatusType = (status) => {
  const map = { pending: 'info', 进行中: 'warning', 完成: 'success', 延误: 'danger' }
  return map[status] || 'info'
}

const getTaskStatusType = (status) => {
  const map = { '未开展': 'info', '进行中': 'warning', '完成': 'success', '延误': 'danger' }
  return map[status] || 'info'
}

const handleAddFeature = () => {
  featureForm.value = { featureName: '', purpose: '', ownerId: null, ownerName: '', createDate: new Date().toISOString().split('T')[0], targetDate: '', documentPath: '' }
  uploadedFiles.value = []
  isFeatureEdit.value = false
  featureDialogVisible.value = true
}

const editFeature = (row) => {
  const docPath = row.f_document_path || ''
  uploadedFiles.value = docPath ? docPath.split(',').filter(p => p).map(p => ({ fileName: p.split('/').pop(), path: p })) : []
  featureForm.value = { 
    f_id: row.f_id,
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

const submitFeature = async () => {
  if (!featureForm.value.featureName) { ElMessage.warning('请输入功能名称'); return }
  try {
    const formData = new FormData()
    formData.append('projectId', projectId)
    formData.append('branch', branch)
    formData.append('featureName', featureForm.value.featureName)
    formData.append('purpose', featureForm.value.purpose)
    formData.append('ownerId', featureForm.value.ownerId || '')
    formData.append('ownerName', featureForm.value.ownerName || '')
    formData.append('createDate', featureForm.value.createDate)
    formData.append('targetDate', featureForm.value.targetDate || '')
    formData.append('supplierId', featureForm.value.supplierId || '')
    formData.append('documentPath', featureForm.value.documentPath || '')
    formData.append('status', featureForm.value.status || 'pending')
    formData.append('summary', featureForm.value.summary || '')
    
    const url = isFeatureEdit.value 
      ? API_URL + '/feature/' + featureForm.value.f_id 
      : API_URL + '/feature'
    const method = isFeatureEdit.value ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method: method,
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` },
      body: formData
    })
    const data = await res.json()
    if (data.code === 200) {
      ElMessage.success(isFeatureEdit.value ? '更新成功' : '创建成功')
      featureDialogVisible.value = false
      fetchFeatures()
    } else {
      ElMessage.error(data.message || '操作失败')
    }
  } catch (e) { 
    console.error(e)
    ElMessage.error('操作失败: ' + e.message) 
  }
}

const deleteFeature = (row) => {
  ElMessageBox.confirm('确认删除此功能？', '警告', { type: 'warning' }).then(async () => {
    try {
      const res = await fetch(`/api/pm/feature/${row.f_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
      })
      const data = await res.json()
      if (data.code === 200) {
        ElMessage.success('删除成功')
        fetchFeatures()
      }
    } catch (e) { ElMessage.error('删除失败') }
  }).catch(() => {})
}

const showTasks = (row) => {
  currentFeature.value = row
  fetchTasks(row.f_id)
  taskDialogVisible.value = true
}

const handleAddTask = () => {
  taskForm.value = { taskContent: '', targetDate: '', ownerId: null, ownerName: '', supplierId: null, status: '未开展', progress: 0, documentPath: '' }
  isTaskEdit.value = false
  taskFormVisible.value = true
}

const editTask = (row) => {
  taskForm.value = { ...row, taskContent: row.f_task_content, targetDate: row.f_target_date, ownerId: row.f_owner_id, ownerName: row.f_owner_name, supplierId: row.f_supplier_id, status: row.f_status, progress: row.f_progress }
  isTaskEdit.value = true
  taskFormVisible.value = true
}

const onTaskOwnerChange = (val) => {
  const u = users.value.find(u => u.f_id === val)
  if (u) taskForm.value.ownerName = u.f_user_name
}

const onTaskUploadSuccess = (res) => {
  if (res.code === 200) taskForm.value.documentPath = res.data
  ElMessage.success('上传成功')
}

const submitTask = async () => {
  if (!taskForm.value.taskContent) { ElMessage.warning('请输入工作内容'); return }
  try {
    const formData = new FormData()
    formData.append('featureId', currentFeature.value.f_id)
    formData.append('taskContent', taskForm.value.taskContent)
    formData.append('targetDate', taskForm.value.targetDate)
    formData.append('ownerId', taskForm.value.ownerId || '')
    formData.append('ownerName', taskForm.value.ownerName || '')
    formData.append('supplierId', taskForm.value.supplierId || '')
    formData.append('status', taskForm.value.status)
    formData.append('progress', taskForm.value.progress)
    
    const res = await fetch(API_URL + '/task', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` },
      body: formData
    })
    const data = await res.json()
    if (data.code === 200) {
      ElMessage.success('创建成功')
      taskFormVisible.value = false
      fetchTasks(currentFeature.value.f_id)
    }
  } catch (e) { ElMessage.error('操作失败') }
}

const completeFeature = async () => {
  if (!summaryForm.value.summary) {
    ElMessage.warning('请填写总结')
    return
  }
  try {
    const res = await fetch(`/api/pm/feature/${currentFeature.value.f_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('pm_token')}` },
      body: JSON.stringify({ status: '完成', summary: summaryForm.value.summary, completeDate: new Date().toISOString().split('T')[0] })
    })
    const data = await res.json()
    if (data.code === 200) {
      ElMessage.success('功能已完成')
      taskDialogVisible.value = false
      fetchFeatures()
    }
  } catch (e) { ElMessage.error('操作失败') }
}

onMounted(() => { fetchFeatures(); fetchUsers(); fetchSuppliers() })
</script>

<style scoped>
.header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
.header h3 { margin: 0; }
</style>
