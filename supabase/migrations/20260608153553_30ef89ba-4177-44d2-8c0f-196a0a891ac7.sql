
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS pricing jsonb NOT NULL DEFAULT '{
  "base": {"Tow": 75, "Lockout": 55, "Jumpstart": 45, "Tire": 50, "Winch": 95, "Other": 60},
  "mileage": {"perMile": 4.50, "freeMiles": 5},
  "afterHours": {"enabled": true, "amount": 25, "startHour": 21, "endHour": 6},
  "weekend": {"enabled": true, "amount": 15},
  "holiday": {"enabled": true, "multiplier": 1.5},
  "fees": {
    "oversized": {"enabled": true, "amount": 45},
    "hazmat": {"enabled": true, "amount": 65},
    "longWait": {"enabled": true, "amount": 35},
    "storage": {"enabled": true, "amount": 35},
    "secondTruck": {"enabled": true, "amount": 85},
    "highway": {"enabled": true, "amount": 20}
  }
}'::jsonb;
