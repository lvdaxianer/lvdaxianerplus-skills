# 数据库规范示例

## SQL 查询示例

```sql
-- 正确
SELECT * FROM `users` WHERE `id` = ? LIMIT 10;

-- 错误
SELECT * FROM users WHERE id = " + userId;
```

## Git 提交规范示例

```bash
git commit -m "$(cat <<'EOF'
feat: 添加用户登录功能

实现基于 JWT 的用户认证流程
关联 issue: #123

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```