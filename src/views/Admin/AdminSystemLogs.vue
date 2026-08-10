<script setup>
import { computed, onMounted, ref } from "vue";
import SystemLogServices from "../../services/SystemLogServices";
import SystemLogItem from "../../components/SystemLogItem.vue";

const filterWidth = "200px";

const logs = ref(null);
const search = ref("");
const selectedActions = ref([]);
const selectedTypes = ref([]);

const filteredLogs = computed(() => {
  const query = search.value.toLowerCase().trim();

  return (logs.value ?? []).filter((log) => {
    if (
      selectedActions.value.length &&
      !selectedActions.value.includes(log.action)
    ) {
      return false;
    }

    if (
      selectedTypes.value.length &&
      !selectedTypes.value.includes(log.subjectType)
    ) {
      return false;
    }

    if (!query) {
      return true;
    }

    return JSON.stringify(log).toLowerCase().includes(query);
  });
});

const groupedActions = computed(() => {
  const groups = {};

  (logs.value ?? []).forEach((log) => {
    if (!groups[log.subjectType]) {
      groups[log.subjectType] = [];
    }

    if (!groups[log.subjectType].includes(log.action)) {
      groups[log.subjectType].push(log.action);
    }
  });

  return groups;
});

const subjectTypes = computed(() => {
  return [...new Set((logs.value ?? []).map((log) => log.subjectType))];
});

onMounted(async () => {
  await getSystemLogs();
});

async function getSystemLogs() {
  try {
    const response = await SystemLogServices.getSystemLogs();
    logs.value = response.data;
    console.log("System Logs:", logs.value);
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <v-container>
    <v-card variant="flat" border rounded="lg">

      <v-toolbar flat>
        <v-toolbar-title>
          System Logs
        </v-toolbar-title>

        <v-text-field
          v-model="search"
          :style="{ width: filterWidth }"
          density="compact"
          label="Search"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          hide-details
          single-line
          class="me-2"
        ></v-text-field>


        <!-- Actions Dropdown -->
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              density="compact"
              height="40"
              :style="{ width: filterWidth }"
              class="me-2"
            >
              Actions
              <v-icon end>
                mdi-chevron-down
              </v-icon>
            </v-btn>
          </template>

          <v-card min-width="250">
            <v-list density="compact">

              <template
                v-for="(actions, type) in groupedActions"
                :key="type"
              >

                <v-list-subheader>
                  {{ type }}
                </v-list-subheader>

                <v-list-item
                  v-for="action in actions"
                  :key="action"
                >
                  <v-checkbox
                    v-model="selectedActions"
                    :label="action"
                    :value="action"
                    hide-details
                    density="compact"
                  />
                </v-list-item>

              </template>

            </v-list>
          </v-card>
        </v-menu>


        <!-- Types Dropdown -->
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              density="compact"
              height="40"
              :style="{ width: filterWidth }"
            >
              Types
              <v-icon end>
                mdi-chevron-down
              </v-icon>
            </v-btn>
          </template>


          <v-card min-width="220">
            <v-list density="compact">

              <v-list-item
                v-for="type in subjectTypes"
                :key="type"
              >
                <v-checkbox
                  v-model="selectedTypes"
                  :label="type"
                  :value="type"
                  hide-details
                  density="compact"
                />
              </v-list-item>

            </v-list>
          </v-card>
        </v-menu>

      </v-toolbar>


      <!-- System Log Feed -->
      <template v-if="filteredLogs.length">

        <template
          v-for="log in filteredLogs"
          :key="log.id"
        >
          <v-divider></v-divider>

          <SystemLogItem :log="log" />
        </template>

      </template>


      <div
        v-else
        class="py-8 text-center"
      >
        No system logs found.
      </div>


    </v-card>
  </v-container>
</template>