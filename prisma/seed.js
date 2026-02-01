import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.admin.upsert({
        where: { email: 'admin@pizzeriamavi.fi' },
        update: {},
        create: {
            email: 'admin@pizzeriamavi.fi',
            passwordHash: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'OWNER',
        },
    });
    console.log('✅ Admin user created:', admin.email);


    // Create regular user
    const userPassword = await bcrypt.hash('user123', 12);
    const user = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            passwordHash: userPassword,
            firstName: 'John',
            lastName: 'Doe',
            phone: '+358401234567',
            address: {
                street: 'Mannerheimintie 1',
                city: 'Helsinki',
                postalCode: '00100'
            },
            isActive: true,
        },
    });
    console.log('✅ Regular user created:', user.email);

    // Create categories
    const pizzaCategory = await prisma.category.upsert({
        where: { slug: 'pizza' },
        update: {},
        create: {
            name: 'Pizza',
            slug: 'pizza',
            description: 'Delicious handmade pizzas',
            displayOrder: 1,
            isActive: true,
        },
    });

    const pastaCategory = await prisma.category.upsert({
        where: { slug: 'pasta' },
        update: {},
        create: {
            name: 'Pasta',
            slug: 'pasta',
            description: 'Fresh pasta dishes',
            displayOrder: 2,
            isActive: true,
        },
    });

    const drinksCategory = await prisma.category.upsert({
        where: { slug: 'drinks' },
        update: {},
        create: {
            name: 'Drinks',
            slug: 'drinks',
            description: 'Refreshing beverages',
            displayOrder: 3,
            isActive: true,
        },
    });

    console.log('✅ Categories created');

    // Create ingredients
    const ingredients = await Promise.all([
        prisma.ingredient.upsert({
            where: { id: '00000000-0000-0000-0000-000000000001' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000001',
                name: 'Tomato Sauce',
                price: 0,
                allergens: [],
            },
        }),
        prisma.ingredient.upsert({
            where: { id: '00000000-0000-0000-0000-000000000002' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000002',
                name: 'Mozzarella',
                price: 0,
                allergens: ['DAIRY'],
            },
        }),
        prisma.ingredient.upsert({
            where: { id: '00000000-0000-0000-0000-000000000003' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000003',
                name: 'Pepperoni',
                price: 3.0,
                allergens: [],
            },
        }),
        prisma.ingredient.upsert({
            where: { id: '00000000-0000-0000-0000-000000000004' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000004',
                name: 'Mushrooms',
                price: 2.0,
                allergens: [],
            },
        }),
        prisma.ingredient.upsert({
            where: { id: '00000000-0000-0000-0000-000000000005' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000005',
                name: 'Extra Cheese',
                price: 2.5,
                allergens: ['DAIRY'],
            },
        }),
        prisma.ingredient.upsert({
            where: { id: '00000000-0000-0000-0000-000000000006' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000006',
                name: 'Olives',
                price: 1.5,
                allergens: [],
            },
        }),
    ]);

    console.log('✅ Ingredients created');

    // Create products
    const margherita = await prisma.product.upsert({
        where: { slug: 'margherita-pizza' },
        update: {},
        create: {
            categoryId: pizzaCategory.id,
            name: 'Margherita Pizza',
            slug: 'margherita-pizza',
            description: 'Classic pizza with tomato sauce and mozzarella',
            basePrice: 12.90,
            isAvailable: true,
            isCustomizable: true,
            preparationTime: 20,
            allergens: ['GLUTEN', 'DAIRY'],
        },
    });

    const pepperoniPizza = await prisma.product.upsert({
        where: { slug: 'pepperoni-pizza' },
        update: {},
        create: {
            categoryId: pizzaCategory.id,
            name: 'Pepperoni Pizza',
            slug: 'pepperoni-pizza',
            description: 'Classic pepperoni pizza with extra cheese',
            basePrice: 15.90,
            isAvailable: true,
            isCustomizable: true,
            preparationTime: 20,
            allergens: ['GLUTEN', 'DAIRY'],
        },
    });

    const carbonara = await prisma.product.upsert({
        where: { slug: 'carbonara-pasta' },
        update: {},
        create: {
            categoryId: pastaCategory.id,
            name: 'Carbonara',
            slug: 'carbonara-pasta',
            description: 'Creamy pasta with bacon and parmesan',
            basePrice: 13.90,
            isAvailable: true,
            isCustomizable: false,
            preparationTime: 15,
            allergens: ['GLUTEN', 'DAIRY', 'EGGS'],
        },
    });

    const cola = await prisma.product.upsert({
        where: { slug: 'coca-cola' },
        update: {},
        create: {
            categoryId: drinksCategory.id,
            name: 'Coca Cola',
            slug: 'coca-cola',
            description: 'Classic Coca Cola 0.33L',
            basePrice: 2.50,
            isAvailable: true,
            isCustomizable: false,
            preparationTime: 1,
            allergens: [],
        },
    });

    console.log('✅ Products created');

    // Add default ingredients to pizzas
    await prisma.productIngredient.createMany({
        data: [
            {
                productId: margherita.id,
                ingredientId: '00000000-0000-0000-0000-000000000001', // Tomato Sauce
                isDefault: true,
                isRemovable: false,
            },
            {
                productId: margherita.id,
                ingredientId: '00000000-0000-0000-0000-000000000002', // Mozzarella
                isDefault: true,
                isRemovable: true,
            },
            {
                productId: pepperoniPizza.id,
                ingredientId: '00000000-0000-0000-0000-000000000001', // Tomato Sauce
                isDefault: true,
                isRemovable: false,
            },
            {
                productId: pepperoniPizza.id,
                ingredientId: '00000000-0000-0000-0000-000000000002', // Mozzarella
                isDefault: true,
                isRemovable: true,
            },
            {
                productId: pepperoniPizza.id,
                ingredientId: '00000000-0000-0000-0000-000000000003', // Pepperoni
                isDefault: true,
                isRemovable: true,
            },
        ],
        skipDuplicates: true,
    });

    // Add customizable ingredients to pizzas
    await prisma.customizableIngredient.createMany({
        data: [
            {
                productId: margherita.id,
                ingredientId: '00000000-0000-0000-0000-000000000003', // Pepperoni
                action: 'ADD',
                priceModifier: 3.0,
            },
            {
                productId: margherita.id,
                ingredientId: '00000000-0000-0000-0000-000000000004', // Mushrooms
                action: 'ADD',
                priceModifier: 2.0,
            },
            {
                productId: margherita.id,
                ingredientId: '00000000-0000-0000-0000-000000000005', // Extra Cheese
                action: 'ADD',
                priceModifier: 2.5,
            },
            {
                productId: margherita.id,
                ingredientId: '00000000-0000-0000-0000-000000000006', // Olives
                action: 'ADD',
                priceModifier: 1.5,
            },
            {
                productId: pepperoniPizza.id,
                ingredientId: '00000000-0000-0000-0000-000000000004', // Mushrooms
                action: 'ADD',
                priceModifier: 2.0,
            },
            {
                productId: pepperoniPizza.id,
                ingredientId: '00000000-0000-0000-0000-000000000005', // Extra Cheese
                action: 'ADD',
                priceModifier: 2.5,
            },
        ],
        skipDuplicates: true,
    });

    console.log('✅ Product ingredients and customizations created');

    console.log('🎉 Database seed completed!');
    console.log('\n📝 Admin credentials:');
    console.log('   Email: admin@pizzeriamavi.fi');
    console.log('   Password: admin123');
    console.log('\n👤 User credentials:');
    console.log('   Email: user@example.com');
    console.log('   Password: user123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
