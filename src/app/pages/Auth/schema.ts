// src\app\pages\Auth\schema.ts
import * as Yup from "yup";

export interface AuthFormValues {
  username: string;
  password: string;
}

export const schema = Yup.object().shape({
  username: Yup.string()
    .trim()
    .required("نام کاربری الزامی است"),
    
  password: Yup.string()
    .trim()
    .required("رمز عبور الزامی است"),
});
