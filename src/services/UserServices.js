import apiClient from "./services";

export default {
  getUsers() {
    return apiClient.get("users");
  },
  getUser(id) {
    return apiClient.get(`users/${id}`);
  },
  addUser(user) {
    return apiClient.post("users", user);
  },
  updateUser(id, user) {
    return apiClient.put(`users/${id}`, user);
  },
  deleteUser(user) {
    return apiClient.delete(`users/${user.id}`);
  },
  loginUser(user) {
    console.log(user);
    return apiClient.post("login", user.value, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        crossDomain: true,
        Authorization:
          "Basic " + btoa(user.value.email + ":" + user.value.password),
      },
    });
  },
  logoutUser() {
    return apiClient.post("logout");
  },
};
