// Supabase database types
// This file should be generated using: npm run types:supabase
// For now, using a minimal type definition

export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
  };
};
