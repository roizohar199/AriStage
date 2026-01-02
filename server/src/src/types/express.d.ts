import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    user: {
      id: number;
      email: string;
      role: string;
      full_name?: string;
    };
    // Multer attaches `file` for single-file uploads. Kept permissive to avoid
    // adding extra type dependencies.
    file?: any;
  }
}
