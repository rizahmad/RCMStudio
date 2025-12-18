-- Demo seed for Prisma/MySQL
INSERT INTO Tenant (id, name, practiceName, npi, taxId, address) VALUES
(1, 'RCM Studio Demo', 'RCM Studio Practice', '1234567890', '12-3456789', '123 Demo St, Springfield, USA')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO User (id, tenant_id, email, password_hash, role, name) VALUES
(1, 1, 'demo@rcmstudio.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'ADMIN', 'Demo User'),
(2, 1, 'biller@rcmstudio.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'BILLER', 'Biller User'),
(3, 1, 'coder@rcmstudio.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'CODER', 'Coder User')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Patients
INSERT INTO Patient (id, tenant_id, first_name, last_name, dob, gender) VALUES
(1, 1, 'Jane', 'Doe', '1987-04-12', 'F'),
(2, 1, 'John', 'Smith', '1979-09-22', 'M'),
(3, 1, 'Alicia', 'Nguyen', '1992-02-03', 'F')
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- Insurance
INSERT INTO Insurance (id, tenant_id, patient_id, payer_name, member_id, subscriber_name, subscriber_dob, card_url) VALUES
(1, 1, 1, 'Blue Shield', 'BS123456', 'Jane Doe', '1987-04-12', 'https://via.placeholder.com/400x250?text=Blue+Shield+Card'),
(2, 1, 2, 'Aetna', 'AE987654', 'John Smith', '1979-09-22', 'https://via.placeholder.com/400x250?text=Aetna+Card'),
(3, 1, 3, 'UnitedHealthcare', 'UH246810', 'Alicia Nguyen', '1992-02-03', 'https://via.placeholder.com/400x250?text=UHC+Card')
ON DUPLICATE KEY UPDATE payer_name = VALUES(payer_name);

-- Encounters
INSERT INTO Encounter (id, tenant_id, patient_id, date_of_service, provider_npi, place_of_service, notes, status) VALUES
(1, 1, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), '1111111111', '11', 'Follow-up visit', 'CLAIMED'),
(2, 1, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), '2222222222', '11', 'Initial consult', 'CLAIMED'),
(3, 1, 3, DATE_SUB(NOW(), INTERVAL 1 DAY), '3333333333', '11', 'Annual physical', 'OPEN')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Charges
INSERT INTO Charge (id, tenant_id, encounter_id, cpt, icd10, modifier, units, charge_amount) VALUES
(1, 1, 1, '99213', 'J06.9', NULL, 1, 150.00),
(2, 1, 1, '87070', 'J06.9', '25', 1, 85.00),
(3, 1, 2, '99203', 'M54.5', NULL, 1, 180.00),
(4, 1, 3, '99395', 'Z00.00', NULL, 1, 200.00)
ON DUPLICATE KEY UPDATE charge_amount = VALUES(charge_amount);

-- Claims (claim_json kept simple but includes scrubber + aiReview placeholders)
INSERT INTO Claim (id, tenant_id, patient_id, encounter_id, status, claim_json, createdAt, submittedAt) VALUES
(1, 1, 1, 1, 'SUBMITTED',
 JSON_OBJECT(
   'billingProvider', JSON_OBJECT('npi', '1111111111', 'taxId', '12-3456789'),
   'renderingProvider', JSON_OBJECT('npi', '1111111111'),
   'subscriber', JSON_OBJECT('name', 'Jane Doe', 'memberId', 'BS123456', 'dob', '1987-04-12'),
   'patient', JSON_OBJECT('name', 'Jane Doe', 'dob', '1987-04-12'),
   'serviceLines', JSON_ARRAY(
     JSON_OBJECT('cpt', '99213', 'icd10', 'J06.9', 'modifier', '', 'units', 1, 'charge', 150),
     JSON_OBJECT('cpt', '87070', 'icd10', 'J06.9', 'modifier', '25', 'units', 1, 'charge', 85)
   ),
   'scrubber', JSON_OBJECT('valid', true, 'errors', JSON_ARRAY(), 'ranAt', NOW()),
   'aiReview', JSON_OBJECT('summary', 'Clean claim', 'risks', JSON_ARRAY('Low risk'), 'suggestedChanges', JSON_ARRAY(), 'confidence', 0.82, 'ranAt', NOW())
 ), NOW(), NOW()),
(2, 1, 2, 2, 'DRAFT',
 JSON_OBJECT(
   'billingProvider', JSON_OBJECT('npi', '2222222222', 'taxId', '12-3456789'),
   'renderingProvider', JSON_OBJECT('npi', '2222222222'),
   'subscriber', JSON_OBJECT('name', 'John Smith', 'memberId', 'AE987654', 'dob', '1979-09-22'),
   'patient', JSON_OBJECT('name', 'John Smith', 'dob', '1979-09-22'),
   'serviceLines', JSON_ARRAY(JSON_OBJECT('cpt', '99203', 'icd10', 'M54.5', 'modifier', '', 'units', 1, 'charge', 180)),
   'scrubber', JSON_OBJECT('valid', false, 'errors', JSON_ARRAY(JSON_OBJECT('field', 'renderingProvider.npi', 'message', 'Missing rendering provider NPI')), 'ranAt', NOW())
 ), NOW(), NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Denials
INSERT INTO Denial (id, tenant_id, claim_id, reason, status, createdAt) VALUES
(1, 1, 2, 'Missing provider NPI', 'OPEN', NOW())
ON DUPLICATE KEY UPDATE reason = VALUES(reason);
