<template>
  <div class="dashboard">
    <h2>项目进度总览</h2>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="甘特图" name="gantt">
        <el-card>
          <div class="gantt-controls">
            <el-date-picker
              v-model="ganttYear"
              type="year"
              placeholder="选择年份"
              @change="renderGantt"
            />
          </div>
          <div class="gantt-container">
            <div class="gantt-header">
              <div class="gantt-col name-col">项目/功能</div>
              <div class="gantt-col month-col" v-for="month in 12" :key="month">{{ month }}月</div>
            </div>
            <div class="gantt-body">
              <template v-for="project in projects" :key="project.f_id">
                <div class="gantt-row project-row">
                  <div class="gantt-cell name-cell">{{ project.f_project_name }}</div>
                  <div class="gantt-cell bar-cell" :colspan="12">
                    <div class="gantt-bar project-bar" :style="getProjectBarStyle(project)">
                      <span>{{ formatDate(project.f_target_date) || '未设置' }}</span>
                    </div>
                  </div>
                </div>
                <template v-for="feature in getProjectFeatures(project.f_id)" :key="feature.f_id">
                  <div class="gantt-row feature-row">
                    <div class="gantt-cell name-cell">
                      <span :class="['branch-tag', feature.f_branch]">[{{ feature.f_branch === 'software' ? '软' : '硬' }}]</span>
                      {{ feature.f_feature_name }}
                    </div>
                    <div class="gantt-cell bar-cell" :colspan="12">
                      <div class="gantt-bar" :class="getStatusClass(feature.f_status)" :style="getFeatureBarStyle(feature)">
                        <span>{{ formatDate(feature.f_create_date) }} - {{ formatDate(feature.f_target_date) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="gantt-row task-row" v-for="task in getFeatureTasks(feature.f_id)" :key="task.f_id">
                    <div class="gantt-cell name-cell task-name">
                      ↳ {{ task.f_task_content }}
                    </div>
                    <div class="gantt-cell bar-cell" :colspan="12">
                      <div class="gantt-bar task-bar" :class="getStatusClass(task.f_status)" :style="getTaskBarStyle(task)">
                        <span>{{ formatDate(task.f_target_date) }}</span>
                      </div>
                    </div>
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
            <el-table-column prop="f_target_date" label="预计完成日期" />
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
import { ref, onMounted } from 'vue'

const activeTab = ref('gantt')
const ganttYear = ref(new Date().getFullYear())
const projects = ref([])
const features = ref([])
const tasks = ref([])

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

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    return dateStr.split('T')[0]
  }
  return dateStr
}

const getMonthFromDate = (dateStr) => {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  return d.getMonth() + 1
}

const getDayFromDate = (dateStr) => {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  return d.getDate()
}

const getProjectBarStyle = (project) => {
  const year = ganttYear.value
  const targetDate = project.f_target_date
  if (!targetDate) return { display: 'none' }
  
  const target = new Date(targetDate)
  if (target.getFullYear() !== year) return { display: 'none' }
  
  const month = target.getMonth()
  const day = target.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leftPercent = ((month * 30 + day) / 365) * 100
  
  return {
    left: leftPercent + '%',
    width: '10%',
    background: '#1890ff'
  }
}

const getFeatureBarStyle = (feature) => {
  const year = ganttYear.value
  const startDate = feature.f_create_date
  const targetDate = feature.f_target_date
  
  if (!startDate && !targetDate) return { display: 'none' }
  
  const start = startDate ? new Date(startDate) : new Date()
  const end = targetDate ? new Date(targetDate) : new Date()
  
  if (start.getFullYear() !== year && end.getFullYear() !== year) return { display: 'none' }
  
  const startMonth = start.getMonth()
  const startDay = start.getDate()
  const endMonth = end.getMonth()
  const endDay = end.getDate()
  
  const startPercent = ((startMonth * 30 + startDay) / 365) * 100
  const duration = ((endMonth - startMonth) * 30 + (endDay - startDay)) / 365 * 100
  
  return {
    left: startPercent + '%',
    width: Math.max(duration, 5) + '%',
    background: feature.f_status === '完成' ? '#52c41a' : feature.f_status === '延误' ? '#ff4d4f' : '#faad14'
  }
}

const getTaskBarStyle = (task) => {
  const year = ganttYear.value
  const targetDate = task.f_target_date
  
  if (!targetDate) return { display: 'none' }
  
  const target = new Date(targetDate)
  if (target.getFullYear() !== year) return { display: 'none' }
  
  const month = target.getMonth()
  const day = target.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leftPercent = ((month * 30 + day) / 365) * 100
  
  return {
    left: leftPercent + '%',
    width: '5%',
    background: task.f_status === '完成' ? '#52c41a' : task.f_status === '延误' ? '#ff4d4f' : '#faad14'
  }
}

const getStatusClass = (status) => {
  if (status === '完成') return 'status-done'
  if (status === '延误') return 'status-delay'
  if (status === '进行中') return 'status-progress'
  return 'status-pending'
}

const renderGantt = () => {
  // Force re-render
}

onMounted(fetchData)
</script>

<style scoped>
.dashboard h2 { margin-bottom: 20px; }

.gantt-controls {
  margin-bottom: 15px;
}

.gantt-container {
  overflow-x: auto;
}

.gantt-header {
  display: flex;
  background: #f5f7fa;
  font-weight: bold;
  border-bottom: 2px solid #dcdfe6;
  min-width: 1200px;
}

.gantt-col {
  padding: 10px;
  border-right: 1px solid #dcdfe6;
  text-align: center;
}

.name-col { width: 200px; min-width: 200px; }
.month-col { width: 80px; min-width: 80px; flex: 1; }

.gantt-row {
  display: flex;
  border-bottom: 1px solid #ebeef5;
  min-width: 1200px;
}

.gantt-cell {
  padding: 8px;
  border-right: 1px solid #ebeef5;
  font-size: 13px;
}

.name-cell {
  width: 200px;
  min-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-cell {
  flex: 1;
  position: relative;
  padding: 5px;
}

.project-row { background: #e6f7ff; }
.project-row .name-cell { font-weight: bold; }

.feature-row { background: #f6ffed; }
.feature-row .name-cell { padding-left: 20px; }

.task-row { background: #fff; }
.task-row .name-cell { padding-left: 40px; color: #666; }

.branch-tag {
  display: inline-block;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 12px;
  margin-right: 5px;
}

.branch-tag.software { background: #1890ff; color: #fff; }
.branch-tag.hardware { background: #52c41a; color: #fff; }

.gantt-bar {
  position: absolute;
  height: 20px;
  border-radius: 3px;
  color: #fff;
  font-size: 11px;
  display: flex;
  align-items: center;
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  min-width: 50px;
}

.project-bar { background: #1890ff; height: 24px; }
.task-bar { height: 16px; font-size: 10px; }

.status-done { background: #52c41a; }
.status-delay { background: #ff4d4f; }
.status-progress { background: #faad14; }
.status-pending { background: #d9d9d9; }
</style>
