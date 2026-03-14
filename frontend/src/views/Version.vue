<template>
  <div class="version-page">
    <h2>版本信息</h2>
    
    <el-card>
      <template #header>
        <div class="card-header">
          <span>当前版本: v{{ currentVersion }}</span>
        </div>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="item in versions"
          :key="item.f_id"
          :timestamp="item.f_create_time"
          placement="top"
        >
          <el-card>
            <h4>v{{ item.f_version }}</h4>
            <p><strong>修改内容:</strong></p>
            <p>{{ item.f_update_content }}</p>
            <p><strong>文件变更:</strong></p>
            <p class="file-changes">{{ item.f_file_changes }}</p>
            <p><strong>表变更:</strong></p>
            <p class="table-changes">{{ item.f_table_changes }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
const API_URL = import.meta.env.PROD ? 'https://pm-backend.zeabur.app' + '/api/pm' : import.meta.env.VITE_API_URL || '/api/pm';
import { ref, onMounted } from 'vue'

const versions = ref([])
const currentVersion = ref('1.1.0')

const fetchVersions = async () => {
  try {
    const res = await fetch(API_URL + '/version', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) {
      versions.value = data.data
      if (data.data.length > 0) {
        currentVersion.value = data.data[0].f_version
      }
    }
  } catch (e) { console.error(e) }
}

onMounted(fetchVersions)
</script>

<style scoped>
.version-page h2 { margin-bottom: 20px; }
.card-header { font-weight: bold; font-size: 16px; }
.file-changes, .table-changes {
  color: #409eff;
  font-size: 13px;
  word-break: break-all;
}
</style>
