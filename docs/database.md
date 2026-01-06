# 数据库结构（Supabase）

本项目使用 Supabase Postgres。以下为当前生产/开发库需要保持一致的表结构、约束与索引。

## 表：site

| 字段 | 类型 | 可空 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 否 | gen_random_uuid() | 站点主键 |
| name | text | 否 | - | 站点名称 |
| description | text | 是 | - | 描述 |
| api_base_url | text | 否 | - | API Base URL（唯一） |
| rate_limit | text | 是 | - | 速率限制 |
| registration_limit | integer | 否 | 2 | 登记等级（0-3） |
| supports_immersive_translation | boolean | 否 | false | 支持沉浸式翻译 |
| supports_ldc | boolean | 否 | false | 支持 LDC |
| supports_checkin | boolean | 否 | false | 支持签到 |
| checkin_url | text | 是 | - | 签到地址 |
| checkin_note | text | 是 | - | 签到说明 |
| benefit_url | text | 是 | - | 福利站 |
| status_url | text | 是 | - | 状态页 |
| is_active | boolean | 否 | true | 保留字段 |
| is_visible | boolean | 否 | true | 是否在列表展示 |
| created_at | timestamptz | 否 | now() | 创建时间 |
| updated_at | timestamptz | 否 | now() | 更新时间 |
| created_by | uuid | 是 | auth.uid() | 创建者 |
| updated_by | uuid | 是 | auth.uid() | 更新者 |

约束：
- UNIQUE(api_base_url)
- PRIMARY KEY(id)

索引：
- site_api_base_url_key (UNIQUE)
- site_pkey (UNIQUE)

## 表：site_tags

| 字段 | 类型 | 可空 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| site_id | uuid | 否 | - | 站点 ID |
| tag_id | text | 否 | - | 标签（纯字符串） |
| created_at | timestamptz | 否 | now() | 创建时间 |
| created_by | uuid | 是 | auth.uid() | 创建者 |

约束：
- PRIMARY KEY(site_id, tag_id)
- FOREIGN KEY(site_id) REFERENCES site(id) ON DELETE CASCADE

索引：
- site_tags_pkey (UNIQUE)
- site_tags_site_id_idx
- site_tags_tag_id_idx

## 表：site_maintainers

| 字段 | 类型 | 可空 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 否 | gen_random_uuid() | 主键 |
| site_id | uuid | 否 | - | 站点 ID |
| name | text | 否 | - | 站长显示名称 |
| profile_url | text | 是 | - | 站长主页链接（LinuxDo 个人页） |
| sort_order | integer | 否 | 0 | 排序 |
| created_at | timestamptz | 否 | now() | 创建时间 |
| updated_at | timestamptz | 否 | now() | 更新时间 |
| created_by | uuid | 是 | auth.uid() | 创建者 |
| updated_by | uuid | 是 | auth.uid() | 更新者 |

约束：
- PRIMARY KEY(id)
- FOREIGN KEY(site_id) REFERENCES site(id) ON DELETE CASCADE

索引：
- site_maintainers_pkey (UNIQUE)
- site_maintainers_site_id_idx

## 表：site_extension_links

| 字段 | 类型 | 可空 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| id | uuid | 否 | gen_random_uuid() | 主键 |
| site_id | uuid | 否 | - | 站点 ID |
| label | text | 否 | - | 名称 |
| url | text | 否 | - | 链接 |
| sort_order | integer | 否 | 0 | 排序 |
| created_at | timestamptz | 否 | now() | 创建时间 |
| updated_at | timestamptz | 否 | now() | 更新时间 |
| created_by | uuid | 是 | auth.uid() | 创建者 |
| updated_by | uuid | 是 | auth.uid() | 更新者 |

约束：
- PRIMARY KEY(id)
- FOREIGN KEY(site_id) REFERENCES site(id) ON DELETE CASCADE

索引：
- site_extension_links_pkey (UNIQUE)
- site_extension_links_site_id_idx
