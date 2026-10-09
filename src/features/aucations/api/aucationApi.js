import apiHelper from "../../../helpers/apiHelper";

const aucationApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/aucations`;

  function _url(path) {
    return BASE_URL + path;
  }

  function buildQuery(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, String(value));
      }
    });
    const text = query.toString();
    return text ? `?${text}` : "";
  }

  async function request(url, options, fallbackMessage) {
    const response = await apiHelper.fetchData(url, options);
    const result = await response.json();
    if (result.status !== "success") {
      throw new Error(result.message || fallbackMessage);
    }
    return result;
  }

  function jsonOptions(method, body) {
    return {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
  }

  async function postAucation(title, description, start_bid, closed_at) {
    const result = await request(
      _url("/"),
      jsonOptions("POST", { title, description, start_bid, closed_at }),
      "Gagal menambahkan lelang"
    );
    return result.data;
  }

  async function postAucationCover(aucationId, cover) {
    const formData = new FormData();
    formData.append("cover", cover, cover.name || "cover.jpg");
    const result = await request(
      _url(`/${aucationId}/cover`),
      { method: "POST", body: formData },
      "Gagal mengubah cover"
    );
    return result.message;
  }

  async function putAucation(aucationId, title, description, start_bid, closed_at) {
    const result = await request(
      _url(`/${aucationId}`),
      jsonOptions("PUT", { title, description, start_bid, closed_at }),
      "Gagal mengubah lelang"
    );
    return result.message;
  }

  async function getAucations(params = {}) {
    const result = await request(
      _url(`/${buildQuery(params)}`),
      { method: "GET" },
      "Gagal mengambil data lelang"
    );
    return result.data?.aucations || [];
  }

  async function getAucationById(aucationId) {
    const result = await request(
      _url(`/${aucationId}`),
      { method: "GET" },
      "Gagal mengambil detail lelang"
    );
    return result.data?.aucation;
  }

  async function deleteAucation(aucationId) {
    const result = await request(
      _url(`/${aucationId}`),
      { method: "DELETE" },
      "Gagal menghapus lelang"
    );
    return result.message;
  }

  async function postBid(aucationId, bid) {
    const result = await request(
      _url(`/${aucationId}/bids`),
      jsonOptions("POST", { bid }),
      "Gagal mengajukan penawaran"
    );
    return result.message;
  }

  async function deleteBid(aucationId) {
    const result = await request(
      _url(`/${aucationId}/bids`),
      { method: "DELETE" },
      "Gagal menghapus penawaran"
    );
    return result.message;
  }

  async function deleteAllAucations() {
    const result = await request(
      _url("/"),
      { method: "DELETE" },
      "Gagal menghapus seluruh lelang"
    );
    return result.message;
  }

  return {
    postAucation,
    postAucationCover,
    putAucation,
    getAucations,
    getAucationById,
    deleteAucation,
    postBid,
    deleteBid,
    deleteAllAucations,
  };
})();

export default aucationApi;
