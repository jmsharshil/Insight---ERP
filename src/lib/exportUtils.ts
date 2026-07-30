import { axiosRequest } from "@/service/axiosRequest";
import { API } from "@/service/api";

export const downloadCsv = async (
  endpoint: string,
  params: Record<string, string | number> = {},
  defaultFilename = "export.csv"
) => {
  try {
    const loginDataRaw = localStorage.getItem("Insight_Login_Data");
    let token = "";
    if (loginDataRaw) {
      const loginData = JSON.parse(loginDataRaw);
      token = loginData?.access || "";
    }

    const config = {
      baseURL: import.meta.env.VITE_APP_BASE_URL,
      method: "GET",
      url: endpoint,
      params,
      responseType: "blob" as const,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };

    const response = await axiosRequest(config);
    
    let filename = defaultFilename;
    const disposition = response.headers["content-disposition"];
    if (typeof disposition === "string" && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const contentType = typeof response.headers["content-type"] === "string" 
      ? response.headers["content-type"] 
      : "text/csv";
      
    const blob = new Blob([response.data], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Export failed:", error);
    throw error;
  }
};

export const downloadExcel = async (
  endpoint: string,
  params: Record<string, string | number | boolean | null | undefined> = {},
  defaultFilename = "export.xlsx",
  method: "GET" | "POST" = "GET"
) => {
  try {
    const loginDataRaw = localStorage.getItem("Insight_Login_Data");
    let token = "";
    if (loginDataRaw) {
      const loginData = JSON.parse(loginDataRaw);
      token = loginData?.access || "";
    }

    const config = {
      baseURL: import.meta.env.VITE_APP_BASE_URL,
      method: method,
      url: endpoint,
      [method === "GET" ? "params" : "data"]: params,
      responseType: "blob" as const,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };

    const response = await axiosRequest(config);
    
    let filename = defaultFilename;
    const disposition = response.headers["content-disposition"];
    if (typeof disposition === "string" && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    // Ensure it ends with .xlsx
    if (!filename.toLowerCase().endsWith('.xlsx')) {
      filename = filename.replace(/\.[^/.]+$/, "") + ".xlsx";
    }

    const contentType = typeof response.headers["content-type"] === "string" 
      ? response.headers["content-type"].toLowerCase() 
      : "";
      
    let finalBlob: Blob;

    if (contentType.includes("csv") || contentType.includes("text")) {
      // Convert CSV text to an Excel workbook
      const textData = await (response.data as Blob).text();
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(textData, { type: "string" });
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      finalBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    } else {
      // Backend returned native binary (e.g. XLSX)
      finalBlob = new Blob([response.data], { type: contentType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    }
    
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Export failed:", error);
    throw error;
  }
};
