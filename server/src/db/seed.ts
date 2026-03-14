import { db } from './connection.ts'
import { users, entries, tags, habitTags, habits } from './schema.ts'

const seed = async () => {
  console.log('🌱 Starting database seeding...')

  try {
    console.log('Clearing existing data...')
    await db.delete(habitTags)
    await db.delete(entries)
    await db.delete(habits)
    await db.delete(tags)
    await db.delete(users)

    console.log('Inserting seed data...')
    const [demoUser] = await db
      .insert(users)
      .values({
        email: 'demo@app.com',
        password: 'password',
        firstName: 'Demo',
        lastName: 'User',
        username: 'DemoUser',
      })
      .returning()

    const [healthTag] = await db
      .insert(tags)
      .values({ name: 'Health', color: '#10b981' })
      .returning()

    const [exerciseHabit] = await db
      .insert(habits)
      .values({
        userId: demoUser.id,
        name: 'Exercise',
        description: 'Go to the gym or do a workout at home',
        frequency: 'daily',
        targetCount: 1,
      })
      .returning()

    await db.insert(habitTags).values({
      habitId: exerciseHabit.id,
      tagId: healthTag.id,
    })

    console.log('Adding completion entries...')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      await db.insert(entries).values({
        habitId: exerciseHabit.id,
        completionDate: date,
        note: `Completed on ${date.toDateString()}`,
      })
    }

    console.log('✅ Database seeding completed successfully!')
    console.log(
      `Demo user credentials: email: ${demoUser.email}, password: ${demoUser.password}`,
    )
  } catch (error) {
    console.error('❌ Error during database seeding:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export default seed
