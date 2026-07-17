# SMART (Sumbermalang Administrasi Terpadu)

SMART is a professional correspondence management system tailored for the administration of Desa Sumbermalang. It serves as an integrated digital platform for official correspondence and public services, ensuring fast, efficient, transparent, and seamless administrative governance for the community.

## Key Features

- **Correspondence Management**: Create, track, and manage official letters and documents efficiently.
- **Template System**: Use customizable document templates (DOCX, PDF) with dynamic field populations.
- **Recent Activity Tracking**: Monitor system usage and recent correspondence activities.
- **Document Processing**: View, parse, and handle various document formats directly within the application.

## Tech Stack

This project is built with modern web technologies:

- **Framework**: [Next.js 16](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database / ORM**: [Prisma](https://www.prisma.io/)
- **Document Processing**: `docx`, `pdf-lib`, `docxtemplater`, `mammoth`, `tesseract.js` (OCR), and `xlsx`
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Achmad96/smart.git
   cd smart
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the environment variables:
   Copy `.env.example` to `.env` and configure your database connection and other variables.

4. Initialize the database:
   ```bash
   npm run db:push
   npm run db:generate
   ```
   *(Optional)* Seed the database with initial data:
   ```bash
   npm run db:seed
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

This project is private and intended for the internal administrative use of Desa Sumbermalang.
