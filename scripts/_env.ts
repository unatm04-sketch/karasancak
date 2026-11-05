// Script'ler Next dışında çalıştığı için .env dosyalarını aynı kurallarla yükler.
// Bu dosya, veritabanı modülünden önce içe aktarılmalıdır.
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
