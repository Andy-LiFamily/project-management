<template>
  <div class="dashboard">
    <h2>项目进度总览</h2>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="甘特图" name="gantt">
        <el-card>
          <div class="gantt-container">
            <div class="gantt-header">
              <div class="gantt-col project-col">项目/功能</div>
              <div class="gantt-col date-col" v-for="month in months" :key="month">{{ month }}</div>
            </div>
            <div class="gantt-body">
              <template v-for="project in projects" :key="project.f_id">
                <div class="gantt-row project-row">
                  <div class="gantt-cell project-name">{{ project.f_project_name }}</div>
                  <div class="gantt-cell" v-for="n in 12" :key="n"></div>
                </div>
                <template v-for="feature in getProjectFeatures(project.f_id)" :key="feature.f_id">
                  <div class="gantt-row feature-row">
                    <div class="gantt-cell feature-name">
                      [{{ feature.f_branch === 'software' ? '软' : '硬' }}] {{ feature.f_feature_name }}
                    </div>
                    <div class="gantt-cell" v-for="n in 12" :key="n"></div>
                  </div>
                  <div class="gantt-row task-row" v-for="task in getFeatureTasks(feature.f_id)" :key="task.f_id">
                    <div class="gantt-cell task-name">↳ {{ task.f_task_content }}</div>
                    <div class="gantt-cell" v-for="n in 12" :key="n"></div>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
      
      <el-tab-pane label="项目列表" name="projects">
        <el-card>
          <el-table :data="projects" border>
            <el-table-column prop="f_project_name" label="项目名称" />
            <el-table-column prop="f_description" label="描述" />
            <el-table-column prop="f_create_time" label="创建时间" />
            <el-table-column label="功能数">
              <template #default="{ row }">{{ getProjectFeatures(row.f_id).length }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
const API_URL = import.meta.env.PROD ? 'https://pm-backend.zeabur.app' + '/api/pm' : import.meta.env.VITE_API_URL || '/api/pm';
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref('gantt')
const projects = ref([])
const features = ref([])
const tasks = ref([])

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const fetchData = async () => {
  try {
    const res = await fetch(API_URL + '/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pm_token')}` }
    })
    const data = await res.json()
    if (data.code === 200) {
      projects.value = data.data.projects
      features.value = data.data.features
      tasks.value = data.data.tasks
    }
  } catch (e) { console.error(e) }
}

const getProjectFeatures = (projectId) => {
  return features.value.filter(f => f.f_project_id === projectId)
}

const getFeatureTasks = (featureId) => {
  return tasks.value.filter(t => t.f_feature_id === featureId)
}

onMounted(fetchData)
</script>

<style scoped>
.dashboard h2 {
  margin-bottom: 20px;
}

.gantt-container {
  overflow-x: auto;
}

.gantt-header {
  display: flex;
  background: #f5f7fa;
  font-weight: bold;
  border-bottom: 2px solid #dcdfe6;
}

.gantt-col {
  padding: 10px;
  border-right: 1px solid #dcdfe6;
  min-width: 100px;
}

.project-col { min-width: 200px; }

.gantt-row {
  display: flex;
  border-bottom: 1px solid #ebeef5;
}

.gantt-cell {
  padding: 8px 10px;
  border-right: 1px solid #ebeef5;
  min-width: 100px;
  font-size: 14px;
}

.project-row { background: #e6f7ff; }
.feature-row { background: #f6ffed; }
.task-row { background: #fff; }

.project-name { font-weight: bold; }
.feature-name { color: #1890ff; }
.task-name { color: #52c41a; }
</style>
