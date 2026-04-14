-- Migration 012: Favorites + Delivery Addresses

-- Favorites
CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dish_id uuid REFERENCES dishes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT favorites_one_item CHECK (
    (dish_id IS NOT NULL AND product_id IS NULL) OR
    (dish_id IS NULL AND product_id IS NOT NULL)
  ),
  CONSTRAINT favorites_unique_dish UNIQUE (user_id, dish_id),
  CONSTRAINT favorites_unique_product UNIQUE (user_id, product_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites: self read"
  ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites: self insert"
  ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites: self delete"
  ON favorites FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_dish ON favorites(user_id, dish_id) WHERE dish_id IS NOT NULL;
CREATE INDEX idx_favorites_product ON favorites(user_id, product_id) WHERE product_id IS NOT NULL;

-- Delivery Addresses
CREATE TABLE delivery_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  address_line text NOT NULL,
  city text,
  notes text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses: self read"
  ON delivery_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "addresses: self insert"
  ON delivery_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addresses: self update"
  ON delivery_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "addresses: self delete"
  ON delivery_addresses FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_addresses_user ON delivery_addresses(user_id);

CREATE OR REPLACE FUNCTION clear_other_default_addresses()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE delivery_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_clear_default_addresses
  AFTER INSERT OR UPDATE OF is_default ON delivery_addresses
  FOR EACH ROW EXECUTE FUNCTION clear_other_default_addresses();
