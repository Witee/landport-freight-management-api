-- 创建管理员账号: landport
-- 密码: Admin,,123

-- 如果用户已存在，先更新
UPDATE users SET 
  username = 'landport', 
  password = '$2b$10$mitOUvFywUxOYARQbYYTneDeyMUk9YKUCphLYdpb1fUtzIokFgJjK', 
  role = 'admin',
  nickname = '管理员',
  openid = 'admin_landport_1762415089480'
WHERE username = 'landport';

-- 如果用户不存在，插入新用户
INSERT INTO users (username, password, role, nickname, openid, createdAt, updatedAt)
SELECT 'landport', '$2b$10$mitOUvFywUxOYARQbYYTneDeyMUk9YKUCphLYdpb1fUtzIokFgJjK', 'admin', '管理员', 'admin_landport_1762415089480', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'landport');

