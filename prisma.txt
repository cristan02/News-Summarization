# Generate Prisma client
npx prisma generate

# Push schema to MongoDB (no migrations needed for MongoDB)
npx prisma db push

# Optional: Open Prisma Studio to view your database
npx prisma studio

# Seed your database with the initial data
npx prisma db seed