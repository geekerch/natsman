<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-6">Settings</h2>

    <n-card title="NATS Profiles" class="mb-6">
      <template #header-extra>
        <n-button type="primary" @click="showEditProfile = true; editingProfile = null; profileForm = { name: '', url: 'nats://localhost:4222', creds_path: '' }">
          Add Profile
        </n-button>
      </template>
      
      <n-list hoverable clickable>
        <n-list-item v-for="profile in profiles" :key="profile.name">
          <div class="flex justify-between items-center">
            <div>
              <div class="font-bold flex items-center gap-2">
                {{ profile.name }}
                <n-tag v-if="activeProfile === profile.name" type="success" size="small">Active</n-tag>
              </div>
              <div class="text-gray-500 text-sm">{{ profile.url }}</div>
              <div v-if="profile.creds_path" class="text-gray-400 text-xs">{{ profile.creds_path }}</div>
            </div>
            <div class="flex gap-2">
              <n-button size="small" v-if="activeProfile !== profile.name" @click="activateProfile(profile.name)">Activate</n-button>
              <n-button size="small" @click="editProfile(profile)">Edit</n-button>
              <n-popconfirm @positive-click="deleteProfile(profile.name)">
                <template #trigger>
                  <n-button size="small" type="error" :disabled="activeProfile === profile.name">Delete</n-button>
                </template>
                Delete this profile?
              </n-popconfirm>
            </div>
          </div>
        </n-list-item>
      </n-list>
    </n-card>

    <!-- Edit Profile Modal -->
    <n-modal v-model:show="showEditProfile" preset="dialog" :title="editingProfile ? 'Edit Profile' : 'Add Profile'">
      <div class="space-y-4 mt-4">
        <n-form-item label="Name">
          <n-input v-model:value="profileForm.name" :disabled="!!editingProfile" placeholder="Profile Name" />
        </n-form-item>
        <n-form-item label="NATS URL">
          <n-input v-model:value="profileForm.url" placeholder="nats://localhost:4222" />
        </n-form-item>
        <n-form-item label="Credentials Path (Optional)">
          <n-input v-model:value="profileForm.creds_path" placeholder="/path/to/creds.creds" />
        </n-form-item>
      </div>
      <template #action>
        <n-button @click="showEditProfile = false">Cancel</n-button>
        <n-button type="primary" @click="saveProfile" :disabled="!profileForm.name || !profileForm.url">Save</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMessage } from 'naive-ui';

// Define types locally for now or import if available
interface NatsProfile {
  name: string;
  url: string;
  creds_path: string;
}

const message = useMessage();
const profiles = ref<NatsProfile[]>([]);
const activeProfile = ref('');
const showEditProfile = ref(false);
const editingProfile = ref<NatsProfile | null>(null);
const profileForm = ref<NatsProfile>({ name: '', url: '', creds_path: '' });

// Helper to access window.go
const getWails = () => (window as any).go?.main?.App;

const loadProfiles = async () => {
  const wails = getWails();
  if (wails) {
    try {
      profiles.value = await wails.GetNatsProfiles();
      activeProfile.value = await wails.GetActiveNatsProfile();
    } catch (err) {
      console.error(err);
    }
  } else {
    // Mock for web mode if needed, or show not supported
    console.warn('Settings only fully supported in Desktop mode');
  }
};

const activateProfile = async (name: string) => {
  const wails = getWails();
  if (wails) {
    try {
      await wails.ActivateNatsProfile(name);
      message.success(`Profile ${name} activated`);
      await loadProfiles();
      // Reload window to apply changes? Or just let services pick it up
      // Services usually pick up config on each request, so it should be fine.
    } catch (err: any) {
      message.error(err.message || 'Failed to activate profile');
    }
  }
};

const saveProfile = async () => {
  const wails = getWails();
  if (wails) {
    try {
      await wails.SaveNatsProfile(profileForm.value);
      message.success('Profile saved');
      showEditProfile.value = false;
      await loadProfiles();
    } catch (err: any) {
      message.error(err.message || 'Failed to save profile');
    }
  }
};

const deleteProfile = async (name: string) => {
  const wails = getWails();
  if (wails) {
    try {
      await wails.DeleteNatsProfile(name);
      message.success('Profile deleted');
      await loadProfiles();
    } catch (err: any) {
      message.error(err.message || 'Failed to delete profile');
    }
  }
};

const editProfile = (profile: NatsProfile) => {
  editingProfile.value = profile;
  profileForm.value = { ...profile };
  showEditProfile.value = true;
};

onMounted(() => {
  loadProfiles();
});
</script>
