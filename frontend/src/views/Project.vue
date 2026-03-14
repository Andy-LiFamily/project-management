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
                <el-table :data="getFeatures(row.f_id, 'software')" size="small">
                  <el-table-column prop="f_feature_name" label="功能名称" />
                  <el-table-column prop="f_purpose" label="目的" show-overflow-tooltip />
                  <el-table-column prop="f_owner_name" label="负责人" width="100" />
                  <el-table-column prop="f_create_date" label="创建日期" width="120" />
                  <el-table-column prop="f_target_date" label="预计完成日期" width="120" />
                  <el-table-column label="状态" width="80">
                    <template #default="{ row }">
                      <el-tag :type="getStatusType(row.f_status)">{{ row.f_status }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80">
                    <template #default="{ row }">
                      <el-button size="small" @click="editFeature(row)">编辑</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
              <el-tab-pane label="硬件功能">
                <el-table :data="getFeatures(row.f_id, 'hardware')" size="small">
                  <el-table-column prop="f_feature_name" label="功能名称" />
                  <el-table-column prop="f_purpose" label="目的" show-overflow-tooltip />
                  <el-table-column prop="f_owner_name" label="负责人" width="100" />
                  <el-table-column prop="f_create_date" label="创建日期" width="120" />
                  <el-table-column prop="f_target_date" label="预计完成日期" width="120" />
                  <el-table-column label="状态" width="80">
                    <template #default="{ row }">
                      <el-tag :type="getStatusType(row.f_status)">{{ row.f_status }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80">
                    <template #default="{ row }">
                      <el-button size="small" @click="editFeature(row)">编辑</el-button>
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
      <el-table-column prop="f_create_user" label="创建人" width="100" />
      <el-table-column prop="f_create_time" label="创建时间" width="180" />
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
      </el-form>
      <template #footer>
        <el-button @click="featureDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFeature">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
const API_URL = import.meta.env.PROD ? 'https://pm-backend.zeabur.app' + '/api/pm' : import.meta.env.VITE_API_URL || '/api/pm';
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const projects = ref([])
const features = ref([])
const users = ref([])
const dialogVisible = ref(false)
const featureDialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({ projectName: '', description: '', targetDate: '' })
const featureForm = ref({ id: null, featureName: '', purpose: '', ownerId: null, ownerName: '', createDate: '', targetDate: '', status: 'pending' })

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

const fetchUsers = async () => {
  try {
    const res = await fetch(API_URL + '/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) users.value = data.data
  } catch (e) { console.error(e) }
}

const getFeatures = (projectId, branch) => {
  return features.value.filter(f => f.f_project_id === projectId && f.f_branch === branch)
}

const getStatusType = (status) => {
  const map = { pending: 'info', 进行中: 'warning', 完成: 'success', 延误: 'danger' }
  return map[status] || 'info'
}

const handleExpand = () => {
  fetchAllFeatures()
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
    status: row.f_status || 'pending'
  }
  featureDialogVisible.value = true
}

const onOwnerChange = (val) => {
  const u = users.value.find(u => u.f_id === val)
  if (u) featureForm.value.ownerName = u.f_user_name
}

const submitFeature = async () => {
  if (!featureForm.value.featureName) {
    ElMessage.warning('请输入功能名称')
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
    }
  } catch (e) { ElMessage.error('更新失败') }
}

onMounted(() => { fetchData(); fetchAllFeatures(); fetchUsers() })
</script>

<style scoped>
.project-page h2 { margin-bottom: 20px; }
.feature-expand { padding: 10px 20px; }
</style>
