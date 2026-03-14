<template>
  <div class="user-page">
    <h2>用户管理</h2>
    <el-button type="primary" @click="handleAdd">新增用户</el-button>
    
    <el-table :data="users" border style="margin-top:20px">
      <el-table-column prop="f_user_id" label="用户ID" />
      <el-table-column prop="f_user_name" label="用户名" />
      <el-table-column prop="f_email" label="邮箱" />
      <el-table-column prop="f_role" label="角色">
        <template #default="{ row }">
          <el-tag :type="row.f_role === 'admin' ? 'danger' : 'success'">{{ row.f_role === 'admin' ? '管理员' : '普通用户' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="f_create_time" label="创建时间" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增用户" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model="form.userId" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="form.userName" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
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
const API_URL = import.meta.env.PROD ? 'https://pm-backend.zeabur.app' + '/api/pm' : import.meta.env.VITE_API_URL || '/api/pm';
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const users = ref([])
const dialogVisible = ref(false)
const form = ref({ userId: '', userName: '', password: '', email: '', role: 'user' })

const fetchData = async () => {
  try {
    const res = await fetch(API_URL + '/user', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) users.value = data.data
  } catch (e) { console.error(e) }
}

const handleAdd = () => {
  form.value = { userId: '', userName: '', password: '', email: '', role: 'user' }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.userId || !form.value.userName || !form.value.password) {
    ElMessage.warning('请填写必填项')
    return
  }
  try {
    const res = await fetch(API_URL + '/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('pm_token')}` },
      body: JSON.stringify(form.value)
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
  ElMessageBox.confirm('确认删除此用户？', '警告', { type: 'warning' }).then(async () => {
    try {
      const res = await fetch(`/api/pm/user/${row.f_id}`, {
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

onMounted(fetchData)
</script>

<style scoped>
.user-page h2 { margin-bottom: 20px; }
</style>
