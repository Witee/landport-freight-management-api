# MySQL 远程连接配置指南

## 问题
MySQL root 用户无法从远程 IP (192.168.0.168) 连接到数据库服务器 (192.168.0.66)

## 解决方案

### 方案 1：在数据库服务器上直接操作（推荐）

如果可以直接访问数据库服务器 (192.168.0.66)，直接在服务器上执行：

```bash
# SSH 登录到数据库服务器
ssh user@192.168.0.66

# 在服务器上登录 MySQL
mysql -u root -p

# 然后执行创建用户的命令
```

### 方案 2：修改 MySQL 配置允许远程连接

在数据库服务器 (192.168.0.66) 上：

1. **检查 MySQL 是否监听所有接口**
   ```bash
   # 查看 MySQL 配置
   cat /etc/mysql/mysql.conf.d/mysqld.cnf | grep bind-address
   # 或者
   cat /etc/my.cnf | grep bind-address
   ```

2. **修改 MySQL 配置**
   ```bash
   # 编辑配置文件
   sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
   # 或者
   sudo nano /etc/my.cnf
   ```
   
   找到 `bind-address` 行，修改为：
   ```ini
   bind-address = 0.0.0.0  # 允许所有 IP 连接
   # 或者
   bind-address = 192.168.0.66  # 只允许特定 IP
   ```

3. **重启 MySQL 服务**
   ```bash
   sudo systemctl restart mysql
   # 或者
   sudo service mysql restart
   ```

### 方案 3：创建允许远程连接的用户（更安全）

在数据库服务器上执行：

```sql
-- 创建测试用户，允许从任何 IP 连接
CREATE USER 'landport_test'@'%' IDENTIFIED BY 'Test_password_123';
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'%';
FLUSH PRIVILEGES;

-- 或者只允许从特定 IP 连接（更安全）
CREATE USER 'landport_test'@'192.168.0.168' IDENTIFIED BY 'Test_password_123';
GRANT ALL PRIVILEGES ON `landport_test`.* TO 'landport_test'@'192.168.0.168';
FLUSH PRIVILEGES;
```

### 方案 4：使用 SSH 隧道（如果无法修改服务器配置）

如果无法修改数据库服务器配置，可以使用 SSH 隧道：

```bash
# 创建 SSH 隧道
ssh -L 3307:localhost:3306 user@192.168.0.66

# 然后修改配置文件使用本地端口
# config/config.unittest.ts
host: 'localhost',
port: 3307,
```

### 方案 5：使用现有用户

如果已经有其他可以远程连接的用户，可以在配置文件中使用：

```typescript
// config/config.unittest.ts
username: process.env.MYSQL_USER?.trim() || 'existing_user',
password: process.env.MYSQL_PASSWORD || 'existing_password',
```

## 检查步骤

1. **检查 MySQL 是否允许远程连接**
   ```bash
   # 在数据库服务器上
   netstat -tlnp | grep 3306
   # 应该看到 0.0.0.0:3306 或 192.168.0.66:3306
   ```

2. **检查防火墙**
   ```bash
   # 确保防火墙允许 3306 端口
   sudo ufw allow 3306
   # 或者
   sudo firewall-cmd --add-port=3306/tcp --permanent
   sudo firewall-cmd --reload
   ```

3. **测试连接**
   ```bash
   # 从客户端测试
   mysql -u root -h 192.168.0.66 -p
   ```

