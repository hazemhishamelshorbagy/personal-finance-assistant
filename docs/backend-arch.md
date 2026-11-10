             Frontend PWA
                  |
                  v
              Backend API
                  |
          Authentication
          Authorization
          Validation
                  |
                  v
          Application Layer
                  |
          +-------+--------+
          |                |
          v                v
    TransferService   TransactionService
          |                |
          +-------+--------+
                  |
                  v
           Financial Logic
                  |
                  v
          Database Access
                  |
                  v
              PostgreSQL





backend/
├── src/
│   ├── config/
│   ├── modules/
│   │   ├── auth/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── transfers/
│   │   ├── budgets/
│   │   └── users/
│   ├── middleware/
│   ├── shared/
│   ├── app.ts
│   └── server.ts
├── prisma/
├── tests/
├── package.json
└── tsconfig.json