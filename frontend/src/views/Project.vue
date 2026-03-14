const API_URL = import.meta.env.VITE_API_URL || '/api/pm';
<template>
  <div class="project-page">
    <h2>项目管理</h2>
    <el-button type="primary" @click="handleAdd">新建项目</el-button>
    
    <el-table :data="projects" border style="margin-top:20px">
      <el-table-column prop="f_project_name" label="项目名称" />
      <el-table-column prop="f_description" label="描述" />
      <el-table-column prop="f_create_user" label="创建人" />
      <el-table-column prop="f_create_time" label="创建时间" />
      <el-table-column label="操作" width="300">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="viewFeatures(row, 'software')">软件</el-button>
          <el-button size="small" type="success" @click="viewFeatures(row, 'hardware')">硬件</el-button>
          <el-button size="small" type="danger" v-if="isAdmin" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="新建项目" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="form.projectName" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
const API_URL = import.meta.env.VITE_API_URL || "/api/pm";
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const projects = ref([])
const dialogVisible = ref(false)
const form = ref({ projectName: '', description: '' })

const user = JSON.parse(localStorage.getItem('pm_user') || '{}')
const isAdmin = computed(() => user.role === 'admin')

const fetchData = async () => {
  try {
    const res = await fetch('/api/pm/project', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) projects.value = data.data
  } catch (e) { console.error(e) }
}

const handleAdd = () => {
  form.value = { projectName: '', description: '' }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.projectName) {
    ElMessage.warning('请输入项目名称')
    return
  }
  try {
    const res = await fetch('/api/pm/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('pm_token')}` },
      body: JSON.stringify({ ...form.value, createUser: user.userName || user.userId })
    })
    const data = await res.json()
    if (data.code === 200) {
      ElMessage.success('创建成功')
      dialogVisible.value = false
      fetchData()
    }
  } catch (e) { ElMessage.error('创建失败') }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除此项目？', '警告', { type: 'warning' }).then(async () => {
    try {
      const res = await fetch(`/api/pm/project/${row.f_id}`, {
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

onMounted(fetchData)
</script>

<style scoped>
.project-page h2 { margin-bottom: 20px; }
</style>
