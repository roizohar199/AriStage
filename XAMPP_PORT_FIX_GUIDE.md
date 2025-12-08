# XAMPP Port Conflict Resolution Guide

## Problem
- **Port 8009**: Already in use by `java.exe` (PID 10716)
- **Port 3306**: Already in use by `mysqld.exe` (PID 8428)
- **Root Cause**: MySQL80 Windows service is running and blocking XAMPP's MySQL

## Solution Options

### Option 1: Stop Existing Services (Recommended)

#### Quick Fix - Run PowerShell Script:
```powershell
# Run as Administrator
.\stop_xampp_conflicts.ps1
```

#### Manual Steps:

1. **Stop MySQL80 Service (REQUIRES ADMINISTRATOR):**
   ```cmd
   REM Run Command Prompt as Administrator, then:
   net stop MySQL80
   ```
   
   OR in PowerShell (as Admin):
   ```powershell
   Stop-Service MySQL80 -Force
   ```
   
   If service won't stop, kill the process:
   ```cmd
   taskkill /F /PID 8428
   ```

2. **Stop Tomcat/Java Service:**
   ```powershell
   # Run as Administrator
   Get-Service *tomcat* | Stop-Service -Force
   # OR kill the process
   taskkill /F /PID 10716
   ```

3. **Verify Ports are Free:**
   ```powershell
   netstat -ano | findstr :8009
   netstat -ano | findstr :3306
   ```

4. **Start XAMPP Control Panel** and start services

---

### Option 2: Configure XAMPP to Use Different Ports

If you need to keep existing services running, change XAMPP ports:

#### Change MySQL Port (3306 → 3307):

1. **Edit `my.ini`** (usually in `C:\xampp\mysql\bin\my.ini`):
   ```ini
   [mysqld]
   port=3307
   ```

2. **Edit XAMPP Control Panel Config:**
   - Open XAMPP Control Panel
   - Click "Config" next to MySQL
   - Edit `my.ini` and change port to 3307
   - Save and restart MySQL

3. **Update Applications:**
   - Change connection strings from `localhost:3306` to `localhost:3307`
   - Update database configs in your projects

#### Change Tomcat Port (8009 → 8010):

1. **Edit `server.xml`** (usually in `C:\xampp\tomcat\conf\server.xml`):
   ```xml
   <!-- Find and change -->
   <Connector port="8009" protocol="AJP/1.3" ... />
   <!-- To -->
   <Connector port="8010" protocol="AJP/1.3" ... />
   ```

2. **Restart Tomcat** in XAMPP Control Panel

---

### Option 3: Disable Windows Services (Permanent Fix)

If you want XAMPP to always manage these services:

1. **Open Services (Win+R → `services.msc`)**
2. **Find MySQL80 service**
3. **Right-click → Properties**
4. **Set Startup type to: Disabled**
5. **Click Stop** (if running)
6. **Click OK**
7. **Find Tomcat service** (if exists) and repeat steps 3-6
8. **Restart computer** or manually stop services

**OR use Command Prompt (as Admin):**
```cmd
sc config MySQL80 start= disabled
net stop MySQL80
```

This prevents MySQL80 from starting automatically on boot.

---

## Quick Commands Reference

### Run as Administrator:

```powershell
# Check what's using ports
netstat -ano | findstr :8009
netstat -ano | findstr :3306

# Find process details
tasklist /FI "PID eq 10716"
tasklist /FI "PID eq 8428"

# Stop MySQL80 service (REQUIRES ADMIN)
net stop MySQL80
# OR
sc stop MySQL80

# Stop processes (if service won't stop)
taskkill /F /PID 10716  # Java/Tomcat
taskkill /F /PID 8428   # MySQL

# List all MySQL/Tomcat services
Get-Service *mysql*
Get-Service *tomcat*

# Stop services (REQUIRES ADMIN)
Get-Service *mysql* | Stop-Service -Force
Get-Service *tomcat* | Stop-Service -Force
```

### Quick Fix - Run as Administrator:

**Option A: Use the batch file**
- Right-click `stop_mysql_service.bat` → **Run as administrator**

**Option B: Use PowerShell script**
- Right-click `fix_mysql_xampp.ps1` → **Run with PowerShell** (as admin)

---

## After Fixing

1. **Restart XAMPP Control Panel**
2. **Start MySQL** - should start on port 3306 (or your new port)
3. **Start Tomcat** - should start on port 8009 (or your new port)
4. **Verify in logs** that services started successfully

---

## Prevention

To prevent this in the future:
- Disable MySQL/Tomcat Windows services if using XAMPP
- Or configure XAMPP to use different ports
- Don't run both XAMPP and standalone MySQL/Tomcat simultaneously

