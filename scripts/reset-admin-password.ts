import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Database file path
const dbPath = path.join(process.cwd(), 'data', 'attendance.db')

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found at:', dbPath)
  process.exit(1)
}

const db = new Database(dbPath)

// Reset admin password to a known value
const newPassword = 'admin123'

try {
  // Check if admin exists
  const admin = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get('admin') as any
  
  if (!admin) {
    console.error('❌ Admin user not found')
    process.exit(1)
  }

  // Update password
  const stmt = db.prepare('UPDATE users SET password = ? WHERE username = ? COLLATE NOCASE')
  const result = stmt.run(newPassword, 'admin')

  if (result.changes > 0) {
    console.log('✅ Admin password reset successfully!')
    console.log(`📝 Username: admin`)
    console.log(`🔑 Password: ${newPassword}`)
    console.log('')
    console.log('You can now login with these credentials.')
  } else {
    console.error('❌ Failed to update password')
    process.exit(1)
  }
} catch (error: any) {
  console.error('❌ Error resetting password:', error.message)
  if (error.message?.includes('database is locked')) {
    console.error('💡 Please close any database viewing tools (like DB Browser) and try again.')
  }
  process.exit(1)
} finally {
  db.close()
}
