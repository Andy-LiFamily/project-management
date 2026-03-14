<template>
  <div class="supplier-page">
    <h2>供应商管理</h2>
    <el-button type="primary" @click="handleAdd">新增供应商</el-button>
    
    <el-table :data="suppliers" border style="margin-top:20px">
      <el-table-column prop="f_supplier_name" label="供应商名称" />
      <el-table-column prop="f_contact_person" label="公司负责人" />
      <el-table-column prop="f_contact_phone" label="负责人电话" />
      <el-table-column prop="f_project_leader" label="项目负责人" />
      <el-table-column prop="f_project_phone" label="项目负责人电话" />
      <el-table-column prop="f_create_time" label="创建时间" />
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增供应商" width="500px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="供应商名称">
          <el-input v-model="form.supplierName" />
        </el-form-item>
        <el-form-item label="公司负责人">
          <el-input v-model="form.contactPerson" />
        </el-form-item>
        <el-form-item label="公司负责人电话">
          <el-input v-model="form.contactPhone" />
        </el-form-item>
        <el-form-item label="项目负责人">
          <el-input v-model="form.projectLeader" />
        </el-form-item>
        <el-form-item label="项目负责人电话">
          <el-input v-model="form.projectPhone" />
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const suppliers = ref([])
const dialogVisible = ref(false)
const form = ref({ supplierName: '', contactPerson: '', contactPhone: '', projectLeader: '', projectPhone: '' })

const fetchData = async () => {
  try {
    const res = await fetch('/api/pm/supplier', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) suppliers.value = data.data
  } catch (e) { console.error(e) }
}

const handleAdd = () => {
  form.value = { supplierName: '', contactPerson: '', contactPhone: '', projectLeader: '', projectPhone: '' }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.supplierName) { ElMessage.warning('请输入供应商名称'); return }
  try {
    const res = await fetch('/api/pm/supplier', {
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

onMounted(fetchData)
</script>

<style scoped>
.supplier-page h2 { margin-bottom: 20px; }
</style>
