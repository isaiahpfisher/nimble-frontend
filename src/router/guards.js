import ProjectServices from "../services/ProjectServices";

export const isLoggedOut = () => {
  if (localStorage.getItem("user") !== null) {
    return { name: "home" };
  }

  return true;
};

export const isLoggedIn = () => {
  if (localStorage.getItem("user") === null) {
    return { name: "login" };
  }

  return true;
};

export const isAdmin = () => {
  const loggedIn = isLoggedIn();
  if (loggedIn !== true) {
    return loggedIn;
  }

  if (!JSON.parse(localStorage.getItem("user"))?.isAdmin) {
    return { name: "home" };
  }

  return true;
};

// Figures out which project to open if id not provided
export const resolveHome = async () => {
  if (localStorage.getItem("user") === null) {
    return { name: "login" };
  }

  let projects = [];
  try {
    const response = await ProjectServices.getProjectsForCurrentUser();
    projects = response.data?.data ?? response.data ?? [];
  } catch (error) {
    console.log(error);
  }

  if (!projects || projects.length === 0) {
    return { name: "createProject" };
  }

  const localStorageProjectId = localStorage.getItem("selectedProjectId");
  const target =
    projects.find((p) => p.id === Number(localStorageProjectId)) ?? projects[0];

  return { name: "projectBoard", params: { id: target.id } };
};
