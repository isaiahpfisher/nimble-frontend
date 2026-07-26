import axios from "axios";

const ISO_DATETIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function reviveDates(key, value) {
  if (typeof value !== "string") {
    return value;
  }

  const dateOnly = DATE_ONLY_RE.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  if (ISO_DATETIME_RE.test(value)) {
    return new Date(value);
  }
  return value;
}

var baseurl = "";
if (import.meta.env.DEV) {
  baseurl = "http://localhost/nimbleapi/";
} else {
  baseurl = "/nimbleapi/";
}

const apiClient = axios.create({
  baseURL: baseurl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Access-Control-Allow-Origin": "*",
    crossDomain: true,
  },
  transformRequest: (data, headers) => {
    let token = null;
    if (localStorage.getItem("user") !== null) {
      token = JSON.parse(localStorage.getItem("user")).token;
    }
    let authHeader = "";
    if (token !== null && token !== "") {
      authHeader = "Bearer " + token;
      headers["Authorization"] = authHeader;
    }
    return JSON.stringify(data);
  },
  transformResponse: function (data) {
    data = JSON.parse(data, reviveDates);
    if (!data.success && data.code == "expired-session") {
      localStorage.removeItem("user");
    }
    return data;
  },
});

export default apiClient;
