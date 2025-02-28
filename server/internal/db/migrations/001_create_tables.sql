-- Create tables
CREATE TABLE IF NOT EXISTS pc_model_numbers (
    id SERIAL PRIMARY KEY,
    model_number TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_types (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_id TEXT NOT NULL UNIQUE,
    type_id INTEGER REFERENCES product_types(id),
    lot_number TEXT,
    inbound_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'out_of_stock')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pc_details (
    id SERIAL PRIMARY KEY,
    product_id TEXT REFERENCES products(product_id),
    model_number TEXT REFERENCES pc_model_numbers(model_number),
    serial_number TEXT NOT NULL UNIQUE,
    purchase_date TIMESTAMP NOT NULL,
    warranty_period INTEGER
);

CREATE TABLE IF NOT EXISTS vest_details (
    id SERIAL PRIMARY KEY,
    product_id TEXT REFERENCES products(product_id),
    type TEXT NOT NULL CHECK (type IN ('DS', 'thin', 'thick')),
    size TEXT NOT NULL,
    has_logo BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS outbound_records (
    id SERIAL PRIMARY KEY,
    product_id TEXT REFERENCES products(product_id),
    staff_id INTEGER REFERENCES staff(id),
    outbound_number TEXT NOT NULL,
    customer_number TEXT,
    customer_name TEXT,
    purchaser_number TEXT,
    purchaser_name TEXT,
    notes TEXT,
    outbound_date TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS inbound_records (
    id SERIAL PRIMARY KEY,
    product_id TEXT REFERENCES products(product_id),
    staff_id INTEGER REFERENCES staff(id),
    inbound_number TEXT NOT NULL,
    inbound_date TIMESTAMP NOT NULL
);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for products table
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);
CREATE INDEX IF NOT EXISTS idx_products_type_id ON products(type_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_pc_details_product_id ON pc_details(product_id);
CREATE INDEX IF NOT EXISTS idx_vest_details_product_id ON vest_details(product_id);
CREATE INDEX IF NOT EXISTS idx_inbound_records_product_id ON inbound_records(product_id);
CREATE INDEX IF NOT EXISTS idx_outbound_records_product_id ON outbound_records(product_id);
CREATE INDEX IF NOT EXISTS idx_product_types_category ON product_types(category);