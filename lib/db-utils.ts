import db from './db'

// User operations
export function getUserByUsername(username: string) {
  // Optimized query - use index on username for faster lookups
  // Case-insensitive comparison using COLLATE NOCASE (faster than LOWER())
  return db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username) as any
}

export function getUserById(id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
}

export function getNextUserId(): string {
  // Get the highest user ID as a number
  const result = db.prepare('SELECT id FROM users ORDER BY CAST(id AS INTEGER) DESC LIMIT 1').get() as any
  
  if (!result) {
    return '01' // First user
  }
  
  // Get current ID as number and increment
  const currentId = parseInt(result.id, 10)
  const nextId = currentId + 1
  
  // Format with leading zero (01, 02, ... 09, 10, 11, etc.)
  return nextId.toString().padStart(2, '0')
}

export function createUser(user: any) {
  const stmt = db.prepare(`
    INSERT INTO users (id, fullName, username, email, address, department, emergencyContactName, emergencyContactPhone, phoneNumber, isPhoneVerified, password, profilePhoto, isAdmin, institution, lecturerContactName, lecturerContactPhone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  return stmt.run(
    user.id,
    user.fullName,
    user.username,
    user.email,
    user.address,
    user.department,
    user.emergencyContactName,
    user.emergencyContactPhone,
    user.phoneNumber || user.emergencyContactPhone || '', // Use phoneNumber if provided, fallback to emergencyContactPhone
    user.isPhoneVerified ? 1 : 0,
    user.password,
    user.profilePhoto || null,
    user.isAdmin ? 1 : 0,
    user.institution || null,
    user.lecturerContactName || null,
    user.lecturerContactPhone || null
  )
}

export function updateUser(id: string, updates: Partial<any>) {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
  const values = Object.values(updates)
  const stmt = db.prepare(`UPDATE users SET ${fields} WHERE id = ?`)
  return stmt.run(...values, id)
}

// Attendance operations
export function getAttendanceByUserAndDate(userId: string, date: string) {
  return db.prepare('SELECT * FROM attendance WHERE userId = ? AND date = ?').get(userId, date) as any
}

export function getAttendanceByUser(userId: string) {
  return db.prepare('SELECT * FROM attendance WHERE userId = ? ORDER BY date DESC').all(userId) as any[]
}

export function createAttendance(attendance: any) {
  const stmt = db.prepare(`
    INSERT INTO attendance (
      id, userId, date, clockInTime, clockOutTime, clockInImage, clockOutImage,
      clockInLatitude, clockInLongitude, clockOutLatitude, clockOutLongitude, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  return stmt.run(
    attendance.id,
    attendance.userId,
    attendance.date,
    attendance.clockInTime,
    attendance.clockOutTime,
    attendance.clockInImage,
    attendance.clockOutImage,
    attendance.clockInLatitude,
    attendance.clockInLongitude,
    attendance.clockOutLatitude,
    attendance.clockOutLongitude,
    attendance.status
  )
}

export function updateAttendance(id: string, updates: Partial<any>) {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
  const values = Object.values(updates)
  const stmt = db.prepare(`UPDATE attendance SET ${fields} WHERE id = ?`)
  return stmt.run(...values, id)
}

// Volume logs operations
export function getVolumeLogByUserAndDate(userId: string, date: string) {
  return db.prepare('SELECT * FROM volume_logs WHERE userId = ? AND date = ?').get(userId, date) as any
}

export function getVolumeLogsByUser(userId: string) {
  return db.prepare('SELECT * FROM volume_logs WHERE userId = ? ORDER BY date DESC').all(userId) as any[]
}

export function getAllVolumeLogs() {
  return db.prepare(`
    SELECT 
      vl.*,
      u.fullName,
      u.email,
      u.department
    FROM volume_logs vl
    JOIN users u ON vl.userId = u.id
    ORDER BY vl.date DESC
  `).all() as any[]
}

export function createVolumeLog(log: any) {
  // First verify the user exists
  const user = getUserById(log.userId)
  if (!user) {
    throw new Error(`User with ID ${log.userId} not found`)
  }
  
  const stmt = db.prepare(`
    INSERT INTO volume_logs (id, userId, date, content)
    VALUES (?, ?, ?, ?)
  `)
  
  try {
    return stmt.run(log.id, log.userId, log.date, log.content || '')
  } catch (error: any) {
    console.error(`Error creating volume log - UserId: ${log.userId}, User exists: ${!!user}, Error:`, error.message)
    throw error
  }
}

export function updateVolumeLog(id: string, content: string) {
  return db.prepare('UPDATE volume_logs SET content = ? WHERE id = ?').run(content, id)
}

// Leave applications operations
export function getLeaveApplicationsByUser(userId: string) {
  return db.prepare('SELECT * FROM leave_applications WHERE userId = ? ORDER BY appliedAt DESC').all(userId) as any[]
}

export function createLeaveApplication(application: any) {
  const stmt = db.prepare(`
    INSERT INTO leave_applications (
      id, userId, startDate, endDate, reason, status, leaveType, mcFile, appliedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  return stmt.run(
    application.id,
    application.userId,
    application.startDate,
    application.endDate,
    application.reason,
    application.status || 'pending',
    application.leaveType || 'regular',
    application.mcFile || null,
    application.appliedAt || new Date().toISOString()
  )
}

// Get supervisor by department
export function getSupervisorByDepartment(department: string) {
  const supervisorMap: Record<string, string> = {
    'Pentadbiran': 'shap.hashim',
    'Kewangan': 'azmarina.aziz',
    'Unit Teknologi Maklumat': 'nasarudin.roslan',
    'Teknikal dan Penyelenggaraan': 'anuar.mansor',
    'Keselamatan dan Kesihatan': 'shamsul.shaari',
    'Operasi': 'engku.zamrin'
  }
  
  const supervisorUsername = supervisorMap[department]
  if (!supervisorUsername) return null
  
  return getUserByUsername(supervisorUsername)
}

// Get all leave applications with filters
export function getLeaveApplications(filters: {
  userId?: string
  status?: string
  approverDept?: string
  approverType?: string
} = {}) {
  let query = 'SELECT la.*, u.fullName, u.department, u.email FROM leave_applications la JOIN users u ON la.userId = u.id WHERE 1=1'
  const params: any[] = []
  
  if (filters.userId) {
    query += ' AND la.userId = ?'
    params.push(filters.userId)
  }
  
  if (filters.status) {
    query += ' AND la.status = ?'
    params.push(filters.status)
  }
  
  if (filters.approverDept && filters.approverType === 'supervisor') {
    // For supervisor review, show leaves from their department that are pending
    query += ' AND u.department = ? AND la.status = ?'
    params.push(filters.approverDept, 'pending')
  }
  
  query += ' ORDER BY la.appliedAt DESC'
  
  return db.prepare(query).all(...params) as any[]
}

// Get leave application by ID
export function getLeaveApplicationById(id: string) {
  return db.prepare(`
    SELECT la.*, u.fullName, u.department, u.email 
    FROM leave_applications la 
    JOIN users u ON la.userId = u.id 
    WHERE la.id = ?
  `).get(id) as any
}

export function updateLeaveApplication(id: string, updates: Partial<any>) {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
  const values = Object.values(updates)
  const stmt = db.prepare(`UPDATE leave_applications SET ${fields} WHERE id = ?`)
  return stmt.run(...values, id)
}

export function deleteLeaveApplication(id: string) {
  console.log('🗑️ deleteLeaveApplication called with ID:', id)
  // Use parameterized query to ensure exact ID match
  const stmt = db.prepare('DELETE FROM leave_applications WHERE id = ?')
  const result = stmt.run(id)
  console.log('🗑️ Delete result:', { changes: result.changes, lastInsertRowid: result.lastInsertRowid })
  return result
}

// Verification code operations
export function saveVerificationCode(email: string, code: string, expiresInMinutes: number = 10) {
  try {
    // Check if table exists and what schema it has
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='verification_codes'").get() as any
    
    if (!tableInfo) {
      // Table doesn't exist, create it with the new schema
      db.exec(`
        CREATE TABLE verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          code TEXT NOT NULL,
          expiresAt DATETIME NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_verification_email ON verification_codes(email);
        CREATE INDEX idx_verification_expires ON verification_codes(expiresAt);
      `)
    } else {
      // Check if table has old schema (email as PRIMARY KEY or INTEGER timestamps)
      const columns = db.prepare("PRAGMA table_info(verification_codes)").all() as any[]
      const hasIdColumn = columns.some(col => col.name === 'id' && col.pk === 1)
      const expiresAtCol = columns.find(col => col.name === 'expiresAt')
      const hasDatetimeExpires = expiresAtCol && (
        expiresAtCol.type.toUpperCase().includes('DATETIME') || 
        expiresAtCol.type.toUpperCase() === 'TEXT'
      )
      
      if (!hasIdColumn || !hasDatetimeExpires) {
        // Migrate to new schema
        console.log('🔄 Migrating verification_codes table to new schema...')
        db.exec('DROP TABLE IF EXISTS verification_codes')
        db.exec(`
          CREATE TABLE verification_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            expiresAt DATETIME NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE INDEX idx_verification_email ON verification_codes(email);
          CREATE INDEX idx_verification_expires ON verification_codes(expiresAt);
        `)
      }
    }
    
    // Clean up expired codes first
    db.prepare("DELETE FROM verification_codes WHERE expiresAt < datetime('now')").run()
    
    // Delete any existing codes for this email
    db.prepare('DELETE FROM verification_codes WHERE email = ?').run(email)
    
    // Insert new code
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString()
    const stmt = db.prepare('INSERT INTO verification_codes (email, code, expiresAt) VALUES (?, ?, ?)')
    return stmt.run(email, code, expiresAt)
  } catch (error: any) {
    console.error('❌ Error saving verification code:', error)
    throw error
  }
}

// Check if code exists without deleting it
export function checkCode(email: string, code: string): boolean {
  try {
    // Check if table exists
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='verification_codes'").get() as any
    
    if (!tableInfo) {
      return false
    }
    
    // Clean up expired codes first
    db.prepare("DELETE FROM verification_codes WHERE expiresAt < datetime('now')").run()
    
    // Check if code exists and is valid (without deleting)
    const result = db.prepare(`
      SELECT * FROM verification_codes 
      WHERE email = ? AND code = ? AND expiresAt > datetime('now')
      ORDER BY createdAt DESC
      LIMIT 1
    `).get(email, code) as any
    
    return !!result
  } catch (error: any) {
    console.error('Error checking code:', error)
    return false
  }
}

export function verifyCode(email: string, code: string, deleteAfterVerify: boolean = true): boolean {
  try {
    // Check if table exists
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='verification_codes'").get() as any
    
    if (!tableInfo) {
      return false
    }
    
    // Clean up expired codes first
    db.prepare("DELETE FROM verification_codes WHERE expiresAt < datetime('now')").run()
    
    // Check if code exists and is valid
    const result = db.prepare(`
      SELECT * FROM verification_codes 
      WHERE email = ? AND code = ? AND expiresAt > datetime('now')
      ORDER BY createdAt DESC
      LIMIT 1
    `).get(email, code) as any
    
    if (result) {
      // Delete the code after successful verification (if requested)
      if (deleteAfterVerify) {
        // Handle both old schema (email as PK) and new schema (id as PK)
        if (result.id !== undefined) {
          db.prepare('DELETE FROM verification_codes WHERE id = ?').run(result.id)
        } else {
          db.prepare('DELETE FROM verification_codes WHERE email = ?').run(email)
        }
      }
      return true
    }
    
    return false
  } catch (error: any) {
    console.error('Error verifying code:', error)
    return false
  }
}

export function getUserByEmail(email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email) as any
}
