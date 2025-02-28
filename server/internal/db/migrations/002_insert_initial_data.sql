-- Insert initial product types
INSERT INTO product_types (category, name) VALUES
    ('device', 'FIFA'),
    ('device', 'WR'),
    ('station', 'NK-915K-16'),
    ('station', 'NK-910-10'),
    ('heart_rate', 'Polar Sense'),
    ('vest', 'DSタイプ'),
    ('vest', '薄型タイプ'),
    ('vest', '厚型タイプ'),
    ('pc', 'ノートPC'),
    ('pc', 'デスクトップPC')
ON CONFLICT DO NOTHING;

-- Insert initial staff member
INSERT INTO staff (name) VALUES ('管理者')
ON CONFLICT DO NOTHING;