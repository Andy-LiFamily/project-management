<template>
  <el-container class="layout-container">
    <!-- Mobile: Hamburger + Drawer -->
    <div class="mobile-header">
      <el-button class="hamburger" :icon="Fold" @click="drawerVisible = true" circle />
      <span class="mobile-title">项目管理系统</span>
    </div>

    <el-drawer v-model="drawerVisible" direction="ltr" size="200px" :with-header="false">
      <div class="drawer-logo">项目管理系统</div>
      <el-menu :default-active="activeMenu" router @select="drawerVisible = false">
        <el-menu-item index="/">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/project">
          <el-icon><Folder /></el-icon>
          <span>项目管理</span>
        </el-menu-item>
        <el-menu-item index="/supplier">
          <el-icon><Shop /></el-icon>
          <span>供应商</span>
        </el-menu-item>
        <el-menu-item index="/user" v-if="isAdmin">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/version">
          <el-icon><Document /></el-icon>
          <span>版本信息</span>
        </el-menu-item>
      </el-menu>
    </el-drawer>

    <!-- Desktop: Normal Sidebar -->
    <el-aside class="desktop-sidebar">
      <div class="logo">项目管理系统</div>
      <el-menu :default-active="activeMenu" router>
        <el-menu-item index="/">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/project">
          <el-icon><Folder /></el-icon>
          <span>项目管理</span>
        </el-menu-item>
        <el-menu-item index="/supplier">
          <el-icon><Shop /></el-icon>
          <span>供应商</span>
        </el-menu-item>
        <el-menu-item index="/user" v-if="isAdmin">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/version">
          <el-icon><Document /></el-icon>
          <span>版本信息</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="desktop-header">
        <div class="header-right">
          <span>{{ userName }}</span>
          <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
      <el-footer height="40px">
        <div class="footer">
          <span>项目管理系统 v{{ currentVersion }}</span>
        </div>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Fold } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userName = ref('')
const role = ref('')
const currentVersion = ref('1.1.0')
const drawerVisible = ref(false)

const activeMenu = computed(() => route.path)
const isAdmin = computed(() => role.value === 'admin')

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('pm_user') || '{}')
  userName.value = user.userName || user.userId
  role.value = user.role || ''
})

const handleLogout = () => {
  localStorage.removeItem('pm_token')
  localStorage.removeItem('pm_user')
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

/* Mobile Header */
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: #304156;
  align-items: center;
  padding: 0 10px;
  z-index: 1000;
}

.hamburger {
  background: transparent;
  border: none;
  color: #fff;
}

.mobile-title {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  margin-left: 10px;
}

/* Drawer styles */
.drawer-logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background: #2b3a4a;
}

/* Desktop Sidebar */
.desktop-sidebar {
  background: #304156;
}

.desktop-sidebar .logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background: #2b3a4a;
}

.el-menu {
  border: none;
  background: #304156;
}

.el-menu-item {
  color: #bfcbd9;
}

.el-menu-item:hover,
.el-menu-item.is-active {
  background: #263445 !important;
  color: #409eff;
}

.desktop-header {
  background: #fff;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.el-main {
  background: #f0f2f5;
  padding: 20px;
  margin-top: 50px; /* Space for mobile header */
}

.el-footer {
  background: #fff;
  text-align: center;
  line-height: 40px;
  border-top: 1px solid #ebeef5;
}

.footer {
  color: #909399;
  font-size: 14px;
}

/* Responsive: Mobile (< 768px) */
@media (max-width: 768px) {
  .mobile-header {
    display: flex;
  }

  .desktop-sidebar {
    display: none;
  }

  .desktop-header {
    display: none;
  }

  .el-main {
    margin-top: 50px;
    padding: 10px;
  }

  .el-footer {
    padding-bottom: 50px; /* Space for mobile nav if needed */
  }
}

/* Make tables scrollable on mobile */
@media (max-width: 768px) {
  :deep(.el-table) {
    overflow-x: auto;
    display: block;
  }

  :deep(.el-table__body-wrapper) {
    overflow-x: auto;
  }
}
</style>
