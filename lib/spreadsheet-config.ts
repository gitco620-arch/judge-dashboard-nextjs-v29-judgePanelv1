// Define persistedIds with placeholder values or import from another file if needed
const persistedIds: { [key: string]: string } = {
  "Class 4": "1E3TH6Z-LFCUxkG3zLeS_lQqyaTaaHfox-keZoiDudKw",
  "Class 5": "1k20S_yaFPXNPcZoWIBx60ePJpMx2LfLRj8TQTdoHXms",
  "Class 7": "1wyPgb9eOjOLaVQAJl11AlZAXow3H--j_AWjsSTIAwiA",
  "Class 11": "1NlCkOtJf445H-JuZWDp12i8m61FKQxSJAdnt2-2_r-A",
  "Class 6": "1TmkP-nLF40wbfi5hfiWt7eXkW3PE9EnuvojhlU7ooBM",
  "Class 8": "15KvL4WVwlv9wEs_TFJML1ZVfCpbli5iLhyM6EXWNbLw",
  "Class 9": "1SsEAJvXthHQ4UYP9LuPoRBaagPoWquuPtyqOUR-LFME",
  "Class 10": "1iBXGlafBNIp1T_EQitrqDBJU4ELzN1TzlabHD2Z4u7Y",
  "Class 12": "1ikZZeEVGKB12noeHCoaTUoYlq6O4s415Lu940N55A2M"
};

export const SPREADSHEET_CONFIG = {
  CREDENTIALS: {
    id: process.env.CREDENTIALS_SPREADSHEET_ID || "1juP3Eg24GYgOmFcxpNMfbUSXK4m7xTqzlN-Cw9ndYQc", // REPLACE WITH YOUR CREDENTIALS SHEET ID
    range: "Sheet1!A:C", // Username, Password, Role
  },
  ADMIN_MASTER: {
    id: process.env.ADMIN_MASTER_SPREADSHEET_ID || "1snk-FZaxyZbSu_Ww-oPnam8JxZ2RLg3etI5TBkr-T1A", // New: Admin Master Sheet ID, defaults to credentials sheet
  },
  CLASSES: {
    "Class 4": {
      id: persistedIds["Class 4"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 5": {
      id: persistedIds["Class 5"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 6": {
      id: persistedIds["Class 6"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 7": {
      id: persistedIds["Class 7"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 8": {
      id: persistedIds["Class 8"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 9": {
      id: persistedIds["Class 9"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 10": {
      id: persistedIds["Class 10"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 11": {
      id: persistedIds["Class 11"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 12": {
      id: persistedIds["Class 12"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
  },
}