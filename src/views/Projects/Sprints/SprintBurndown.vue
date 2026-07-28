<script setup>
import { onMounted } from "vue";
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import SprintServices from "../../../services/SprintServices.js";
import SnackBar from "../../../components/SnackBar.vue";
import { addDays, differenceInDays, endOfDay, format } from "date-fns";
import { Line } from "vue-chartjs";
import { Chart as ChartJS, Tooltip, LineElement, PointElement, CategoryScale, LinearScale, Filler } from "chart.js";

ChartJS.register(Tooltip, LineElement, PointElement, CategoryScale, LinearScale, Filler);

const route = useRoute();

const user = ref(null);
const projectId = ref(route.params.projectId);
const sprintId = ref(route.params.sprintId);
const sprint = ref(null);
const snackbar = ref(null);

const totalPoints = computed(() =>
  sprint.value?.story.reduce((total, story) => {
    return total + (story.estimate ?? 0);
  }, 0),
);

const data = computed(() => {
  let sprintLength = differenceInDays(new Date(sprint.value.endDate), new Date(sprint.value.startDate));
  let days = [];
  const today = new Date();

  for (let i = 0; i <= sprintLength; i++) {
    const date = addDays(new Date(sprint.value.startDate), i);

    // leave out future days
    // (can't change for loop because we want to show ideal points left all the way to the end of the sprint)
    const actualPointsLeft = date <= today ? totalPoints.value - pointsCompletedByDay(date) : null;

    const idealPointsLeft = totalPoints.value - totalPoints.value * (i / sprintLength);

    days.push({ day: i, date, actualPointsLeft, idealPointsLeft });
  }

  return days;
});

const chartData = computed(() => ({
  labels: data.value.map((d) => format(d.date, "MMM d")),
  datasets: [
    {
      label: "Ideal",
      data: data.value.map((d) => d.idealPointsLeft),

      borderColor: "#9e9e9e", // gray
    },
    {
      label: "Actual",
      data: data.value.map((d) => d.actualPointsLeft),
      borderColor: "#80162B", // primary red color
      backgroundColor: getBackgroundColor,
      fill: true,
    },
  ],
}));

const chartOptions = {
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = ctx.dataset.label === "Ideal" ? Math.round(ctx.parsed.y) : ctx.parsed.y;
          return `${ctx.dataset.label}: ${value}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: "Estimate Points Left" },
    },
    x: {
      title: { display: true, text: "Day" },
    },
  },
};

function pointsCompletedByDay(date) {
  return sprint.value.story.reduce((total, story) => {
    if (story.estimate && story.completedAt) {
      const completedAt = new Date(story.completedAt);
      if (completedAt <= endOfDay(date)) {
        return total + story.estimate;
      }
    }
    return total;
  }, 0);
}

function getBackgroundColor(ctx) {
  const { chart } = ctx;
  const { ctx: canvasCtx, chartArea } = chart;
  if (!chartArea) return "rgba(128, 22, 43, 0.2)";
  const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, "rgba(128, 22, 43, 0.4)");
  gradient.addColorStop(1, "rgba(128, 22, 43, 0.1)");
  return gradient;
}

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  getSprint(sprintId.value);
});

async function getSprint(id) {
  try {
    const response = await SprintServices.getSprint(id);
    sprint.value = response.data;
  } catch (error) {
    console.error(error);
    snackbar.value.show(error.response?.data?.message ?? error.message);
  }
}
</script>

<template>
  <v-container v-if="!sprint">
    <v-skeleton-loader color="secondary" type="card"></v-skeleton-loader>
  </v-container>
  <v-container v-else>
    <v-card>
      <v-card-text>
        <div style="position: relative; height: 400px">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </v-card-text>
    </v-card>
  </v-container>

  <SnackBar ref="snackbar" />
</template>
