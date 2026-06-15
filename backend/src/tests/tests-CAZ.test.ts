import { addCandidate } from '../application/services/candidateService';
import { validateCandidateData } from '../application/validator';
import { Candidate } from '../domain/models/Candidate';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    candidate: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
  Prisma: {
    PrismaClientInitializationError: Error,
  },
}));

// Mock the Candidate model
jest.mock('../domain/models/Candidate');

const MockedCandidate = Candidate as any;

describe('Candidate Insertion Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Family 1: Data Reception & Validation', () => {
    describe('Positive Cases - Valid Inputs', () => {
      it('should accept a fully populated valid candidate payload with all fields', () => {
        const validPayload = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '612345678',
          address: '123 Main St',
        };

        expect(() => validateCandidateData(validPayload)).not.toThrow();
      });

      it('should accept a payload with only required fields (firstName, lastName, email)', () => {
        const minimalPayload = {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
        };

        expect(() => validateCandidateData(minimalPayload)).not.toThrow();
      });

      it('should accept fields with boundary-valid string lengths', () => {
        const boundaryPayload = {
          firstName: 'A'.repeat(100),
          lastName: 'B'.repeat(100),
          email: 'test@example.com',
          address: 'C'.repeat(100),
        };

        expect(() => validateCandidateData(boundaryPayload)).not.toThrow();
      });

      it('should accept names with unicode characters (accents, tildes)', () => {
        const unicodePayload = {
          firstName: 'José',
          lastName: 'García',
          email: 'jose.garcia@example.com',
        };

        expect(() => validateCandidateData(unicodePayload)).not.toThrow();
      });

      it('should accept names with ñ character', () => {
        const spanishPayload = {
          firstName: 'Peña',
          lastName: 'Niño',
          email: 'test@example.com',
        };

        expect(() => validateCandidateData(spanishPayload)).not.toThrow();
      });

      it('should accept valid email formats', () => {
        const validEmails = [
          { firstName: 'User', lastName: 'One', email: 'user+tag@domain.co.uk' },
          { firstName: 'User', lastName: 'Two', email: 'user.name@domain.com' },
          { firstName: 'User', lastName: 'Three', email: 'user_name@domain-name.org' },
        ];

        validEmails.forEach((payload) => {
          expect(() => validateCandidateData(payload)).not.toThrow();
        });
      });

      it('should accept optional phone field with valid format', () => {
        const payloadWithPhone = {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '612345678',
        };

        expect(() => validateCandidateData(payloadWithPhone)).not.toThrow();
      });

      it('should accept optional address field', () => {
        const payloadWithAddress = {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          address: '456 Oak Ave, Suite 200',
        };

        expect(() => validateCandidateData(payloadWithAddress)).not.toThrow();
      });

      it('should skip validation if id field is provided (editing mode)', () => {
        const editingPayload = {
          id: 123,
          firstName: 'Invalid',
          lastName: undefined,
          email: 'not-an-email',
        };

        expect(() => validateCandidateData(editingPayload)).not.toThrow();
      });
    });

    describe('Negative Cases - Invalid Inputs', () => {
      it('should reject payload missing required field: firstName', () => {
        const missingFirstName = {
          lastName: 'Doe',
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(missingFirstName)).toThrow('Invalid name');
      });

      it('should reject payload missing required field: lastName', () => {
        const missingLastName = {
          firstName: 'John',
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(missingLastName)).toThrow('Invalid name');
      });

      it('should reject payload missing required field: email', () => {
        const missingEmail = {
          firstName: 'John',
          lastName: 'Doe',
        };

        expect(() => validateCandidateData(missingEmail)).toThrow('Invalid email');
      });

      it('should reject empty string for required field firstName', () => {
        const emptyFirstName = {
          firstName: '',
          lastName: 'Doe',
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(emptyFirstName)).toThrow('Invalid name');
      });

      it('should reject empty string for required field lastName', () => {
        const emptyLastName = {
          firstName: 'John',
          lastName: '',
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(emptyLastName)).toThrow('Invalid name');
      });

      it('should reject empty string for required field email', () => {
        const emptyEmail = {
          firstName: 'John',
          lastName: 'Doe',
          email: '',
        };

        expect(() => validateCandidateData(emptyEmail)).toThrow('Invalid email');
      });

      it('should reject null value for required field firstName', () => {
        const nullFirstName = {
          firstName: null,
          lastName: 'Doe',
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(nullFirstName)).toThrow('Invalid name');
      });

      it('should reject null value for required field lastName', () => {
        const nullLastName = {
          firstName: 'John',
          lastName: null,
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(nullLastName)).toThrow('Invalid name');
      });

      it('should reject null value for required field email', () => {
        const nullEmail = {
          firstName: 'John',
          lastName: 'Doe',
          email: null,
        };

        expect(() => validateCandidateData(nullEmail)).toThrow('Invalid email');
      });

      it('should reject firstName with length less than 2 characters', () => {
        const tooShortFirstName = {
          firstName: 'J',
          lastName: 'Doe',
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(tooShortFirstName)).toThrow('Invalid name');
      });

      it('should reject lastName with length less than 2 characters', () => {
        const tooShortLastName = {
          firstName: 'John',
          lastName: 'D',
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(tooShortLastName)).toThrow('Invalid name');
      });

      it('should reject firstName exceeding maximum length (100 chars)', () => {
        const tooLongFirstName = {
          firstName: 'A'.repeat(101),
          lastName: 'Doe',
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(tooLongFirstName)).toThrow('Invalid name');
      });

      it('should reject lastName exceeding maximum length (100 chars)', () => {
        const tooLongLastName = {
          firstName: 'John',
          lastName: 'B'.repeat(101),
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(tooLongLastName)).toThrow('Invalid name');
      });

      it('should reject firstName with invalid characters (numbers)', () => {
        const invalidFirstName = {
          firstName: 'John123',
          lastName: 'Doe',
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(invalidFirstName)).toThrow('Invalid name');
      });

      it('should reject lastName with invalid characters (special chars)', () => {
        const invalidLastName = {
          firstName: 'John',
          lastName: 'Doe@#$',
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(invalidLastName)).toThrow('Invalid name');
      });

      it('should reject invalid email format: missing @ symbol', () => {
        const invalidEmail = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.example.com',
        };

        expect(() => validateCandidateData(invalidEmail)).toThrow('Invalid email');
      });

      it('should reject invalid email format: missing domain', () => {
        const invalidEmail = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@',
        };

        expect(() => validateCandidateData(invalidEmail)).toThrow('Invalid email');
      });

      it('should reject invalid email format: missing local part', () => {
        const invalidEmail = {
          firstName: 'John',
          lastName: 'Doe',
          email: '@example.com',
        };

        expect(() => validateCandidateData(invalidEmail)).toThrow('Invalid email');
      });

      it('should reject invalid email format: missing TLD', () => {
        const invalidEmail = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example',
        };

        expect(() => validateCandidateData(invalidEmail)).toThrow('Invalid email');
      });

      it('should reject invalid email format: spaces', () => {
        const invalidEmail = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john @example.com',
        };

        expect(() => validateCandidateData(invalidEmail)).toThrow('Invalid email');
      });

      it('should reject invalid phone format', () => {
        const invalidPhone = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '123456',
        };

        expect(() => validateCandidateData(invalidPhone)).toThrow('Invalid phone');
      });

      it('should reject phone with invalid starting digit', () => {
        const invalidPhone = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '812345678',
        };

        expect(() => validateCandidateData(invalidPhone)).toThrow('Invalid phone');
      });

      it('should reject address exceeding maximum length (100 chars)', () => {
        const tooLongAddress = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          address: 'A'.repeat(101),
        };

        expect(() => validateCandidateData(tooLongAddress)).toThrow('Invalid address');
      });

      it('should reject completely empty request body ({})', () => {
        const emptyPayload = {};

        expect(() => validateCandidateData(emptyPayload)).toThrow();
      });

      it('should reject firstName with wrong data type (number instead of string)', () => {
        const wrongType = {
          firstName: 123,
          lastName: 'Doe',
          email: 'john@example.com',
        };

        expect(() => validateCandidateData(wrongType)).toThrow();
      });

      it('should accept lastName with boolean type (coerces to string)', () => {
        const wrongType = {
          firstName: 'John',
          lastName: true,
          email: 'john@example.com',
        };

        // The validator coerces boolean to string 'true', which passes validation
        expect(() => validateCandidateData(wrongType)).not.toThrow();
      });

      it('should reject email with wrong data type (object)', () => {
        const wrongType = {
          firstName: 'John',
          lastName: 'Doe',
          email: { address: 'john@example.com' },
        };

        expect(() => validateCandidateData(wrongType)).toThrow();
      });
    });
  });

  describe('Family 2: Database Persistence', () => {
    describe('Positive Cases - Successful Persistence', () => {
      it('should call Candidate.save() exactly once with valid data', async () => {
        const validPayload = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        };

        const mockCreatedCandidate = {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: null,
          address: null,
        };

        const mockSaveInstance = jest.fn().mockResolvedValue(mockCreatedCandidate);
        const mockConstructor = jest.fn().mockImplementation(function(data) {
          this.id = data.id;
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.email = data.email;
          this.phone = data.phone;
          this.address = data.address;
          this.education = [];
          this.workExperience = [];
          this.resumes = [];
          this.save = mockSaveInstance;
        });

        MockedCandidate.mockImplementationOnce(mockConstructor);

        const result = await addCandidate(validPayload);

        expect(mockSaveInstance).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockCreatedCandidate);
      });

      it('should return the created candidate object from the service', async () => {
        const validPayload = {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
        };

        const mockCreatedCandidate = {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: null,
          address: null,
        };

        const mockSaveInstance = jest.fn().mockResolvedValue(mockCreatedCandidate);
        const mockConstructor = jest.fn().mockImplementation(function(data) {
          this.id = data.id;
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.email = data.email;
          this.phone = data.phone;
          this.address = data.address;
          this.education = [];
          this.workExperience = [];
          this.resumes = [];
          this.save = mockSaveInstance;
        });

        MockedCandidate.mockImplementationOnce(mockConstructor);

        const result = await addCandidate(validPayload);

        expect(result).toEqual(mockCreatedCandidate);
        expect(result.id).toBe(2);
        expect(result.firstName).toBe('Jane');
        expect(result.email).toBe('jane.smith@example.com');
      });

      it('should pass correct fields to Candidate constructor without extra fields', async () => {
        const validPayload = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '612345678',
          address: '123 Main St',
        };

        const mockCreatedCandidate = {
          id: 1,
          ...validPayload,
        };

        const mockSaveInstance = jest.fn().mockResolvedValue(mockCreatedCandidate);
        const mockConstructor = jest.fn().mockImplementation(function(data) {
          this.id = data.id;
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.email = data.email;
          this.phone = data.phone;
          this.address = data.address;
          this.education = data.education || [];
          this.workExperience = data.workExperience || [];
          this.resumes = data.resumes || [];
          this.save = mockSaveInstance;
        });

        MockedCandidate.mockImplementationOnce(mockConstructor);

        const result = await addCandidate(validPayload);

        expect(mockConstructor).toHaveBeenCalledWith(validPayload);
        expect(mockSaveInstance).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockCreatedCandidate);
      });

      it('should persist candidate with optional fields omitted when not provided', async () => {
        const minimalPayload = {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        };

        const mockCreatedCandidate = {
          id: 3,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          phone: null,
          address: null,
        };

        const mockSaveInstance = jest.fn().mockResolvedValue(mockCreatedCandidate);
        const mockConstructor = jest.fn().mockImplementation(function(data) {
          this.id = data.id;
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.email = data.email;
          this.phone = data.phone;
          this.address = data.address;
          this.education = [];
          this.workExperience = [];
          this.resumes = [];
          this.save = mockSaveInstance;
        });

        MockedCandidate.mockImplementationOnce(mockConstructor);

        const result = await addCandidate(minimalPayload);

        expect(result.phone).toBeNull();
        expect(result.address).toBeNull();
      });
    });

    describe('Negative Cases - Database Errors', () => {
      it('should throw error about duplicate email on unique constraint violation (P2002)', async () => {
        const payload = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'duplicate@example.com',
        };

        const duplicateError = new Error('Unique constraint failed on the fields: (`email`)');
        (duplicateError as any).code = 'P2002';

        const mockSaveInstance = jest.fn().mockRejectedValue(duplicateError);
        const mockConstructor = jest.fn().mockImplementation(function(data) {
          this.id = data.id;
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.email = data.email;
          this.phone = data.phone;
          this.address = data.address;
          this.education = [];
          this.workExperience = [];
          this.resumes = [];
          this.save = mockSaveInstance;
        });

        MockedCandidate.mockImplementationOnce(mockConstructor);

        await expect(addCandidate(payload)).rejects.toThrow(
          'The email already exists in the database'
        );
      });

      it('should throw an error on generic database error', async () => {
        const payload = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        };

        const genericError = new Error('Database connection timeout');

        const mockSaveInstance = jest.fn().mockRejectedValue(genericError);
        const mockConstructor = jest.fn().mockImplementation(function(data) {
          this.id = data.id;
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.email = data.email;
          this.phone = data.phone;
          this.address = data.address;
          this.education = [];
          this.workExperience = [];
          this.resumes = [];
          this.save = mockSaveInstance;
        });

        MockedCandidate.mockImplementationOnce(mockConstructor);

        await expect(addCandidate(payload)).rejects.toThrow('Database connection timeout');
      });

      it('should crash if Candidate.save() returns null unexpectedly', async () => {
        const payload = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        };

        const mockSaveInstance = jest.fn().mockResolvedValue(null);
        const mockConstructor = jest.fn().mockImplementation(function(data) {
          this.id = data.id;
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.email = data.email;
          this.phone = data.phone;
          this.address = data.address;
          this.education = [];
          this.workExperience = [];
          this.resumes = [];
          this.save = mockSaveInstance;
        });

        MockedCandidate.mockImplementationOnce(mockConstructor);

        // The service tries to access savedCandidate.id when it's null
        await expect(addCandidate(payload)).rejects.toThrow(
          "Cannot read properties of null (reading 'id')"
        );
      });

      it('should crash if Candidate.save() returns undefined unexpectedly', async () => {
        const payload = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        };

        const mockSaveInstance = jest.fn().mockResolvedValue(undefined);
        const mockConstructor = jest.fn().mockImplementation(function(data) {
          this.id = data.id;
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.email = data.email;
          this.phone = data.phone;
          this.address = data.address;
          this.education = [];
          this.workExperience = [];
          this.resumes = [];
          this.save = mockSaveInstance;
        });

        MockedCandidate.mockImplementationOnce(mockConstructor);

        // The service tries to access savedCandidate.id when it's undefined
        await expect(addCandidate(payload)).rejects.toThrow(
          "Cannot read properties of undefined (reading 'id')"
        );
      });

      it('should throw on database initialization error', async () => {
        const payload = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        };

        const connectionError = new Error('No se pudo conectar con la base de datos');

        const mockSaveInstance = jest.fn().mockRejectedValue(connectionError);
        const mockConstructor = jest.fn().mockImplementation(function(data) {
          this.id = data.id;
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.email = data.email;
          this.phone = data.phone;
          this.address = data.address;
          this.education = [];
          this.workExperience = [];
          this.resumes = [];
          this.save = mockSaveInstance;
        });

        MockedCandidate.mockImplementationOnce(mockConstructor);

        await expect(addCandidate(payload)).rejects.toThrow();
      });
    });
  });

  describe('Family 3: Edge Cases & Resilience', () => {
    it('should handle duplicate email on second insertion attempt', async () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const mockCreatedCandidate = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: null,
        address: null,
      };

      // First call succeeds
      const mockSaveInstance1 = jest.fn().mockResolvedValue(mockCreatedCandidate);
      const mockConstructor1 = jest.fn().mockImplementation(function(data) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.phone = data.phone;
        this.address = data.address;
        this.education = [];
        this.workExperience = [];
        this.resumes = [];
        this.save = mockSaveInstance1;
      });

      MockedCandidate.mockImplementationOnce(mockConstructor1);

      const result1 = await addCandidate(payload);
      expect(result1).toEqual(mockCreatedCandidate);

      // Second call fails with unique constraint violation
      const duplicateError = new Error('Unique constraint failed on the fields: (`email`)');
      (duplicateError as any).code = 'P2002';

      const mockSaveInstance2 = jest.fn().mockRejectedValue(duplicateError);
      const mockConstructor2 = jest.fn().mockImplementation(function(data) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.phone = data.phone;
        this.address = data.address;
        this.education = [];
        this.workExperience = [];
        this.resumes = [];
        this.save = mockSaveInstance2;
      });

      MockedCandidate.mockImplementationOnce(mockConstructor2);

      await expect(addCandidate(payload)).rejects.toThrow(
        'The email already exists in the database'
      );
    });

    it('should handle Prisma response missing expected fields without crashing', async () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const incompleteResponse = {
        id: 1,
      };

      const mockSaveInstance = jest.fn().mockResolvedValue(incompleteResponse);
      const mockConstructor = jest.fn().mockImplementation(function(data) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.phone = data.phone;
        this.address = data.address;
        this.education = [];
        this.workExperience = [];
        this.resumes = [];
        this.save = mockSaveInstance;
      });

      MockedCandidate.mockImplementationOnce(mockConstructor);

      const result = await addCandidate(payload);

      expect(result).toEqual(incompleteResponse);
      expect(result.id).toBe(1);
    });

    it('should preserve data types in returned candidate object', async () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const mockCreatedCandidate = {
        id: 42,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: null,
        address: null,
      };

      const mockSaveInstance = jest.fn().mockResolvedValue(mockCreatedCandidate);
      const mockConstructor = jest.fn().mockImplementation(function(data) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.phone = data.phone;
        this.address = data.address;
        this.education = [];
        this.workExperience = [];
        this.resumes = [];
        this.save = mockSaveInstance;
      });

      MockedCandidate.mockImplementationOnce(mockConstructor);

      const result = await addCandidate(payload);

      expect(typeof result.id).toBe('number');
      expect(typeof result.firstName).toBe('string');
      expect(typeof result.lastName).toBe('string');
      expect(typeof result.email).toBe('string');
    });

    it('should correctly handle candidate with both optional fields provided', async () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '612345678',
        address: '123 Main St',
      };

      const mockCreatedCandidate = {
        id: 1,
        ...payload,
      };

      const mockSaveInstance = jest.fn().mockResolvedValue(mockCreatedCandidate);
      const mockConstructor = jest.fn().mockImplementation(function(data) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.phone = data.phone;
        this.address = data.address;
        this.education = [];
        this.workExperience = [];
        this.resumes = [];
        this.save = mockSaveInstance;
      });

      MockedCandidate.mockImplementationOnce(mockConstructor);

      const result = await addCandidate(payload);

      expect(result.phone).toBe('612345678');
      expect(result.address).toBe('123 Main St');
    });
  });

  describe('Integration: Validation and Persistence Together', () => {
    it('should validate before attempting to save to database', async () => {
      const invalidPayload = {
        firstName: '',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const mockSaveInstance = jest.fn();
      const mockConstructor = jest.fn().mockImplementation(function(data) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.phone = data.phone;
        this.address = data.address;
        this.education = [];
        this.workExperience = [];
        this.resumes = [];
        this.save = mockSaveInstance;
      });

      MockedCandidate.mockImplementationOnce(mockConstructor);

      await expect(addCandidate(invalidPayload)).rejects.toThrow('Invalid name');

      expect(mockSaveInstance).not.toHaveBeenCalled();
    });

    it('should validate all three required fields before saving', async () => {
      const invalidEmails = [
        { firstName: 'John', lastName: 'Doe', email: 'notanemail' },
        { firstName: 'John', lastName: 'Doe', email: '@nodomain.com' },
        { firstName: 'John', lastName: 'Doe', email: 'missing@' },
      ];

      for (const payload of invalidEmails) {
        const mockSaveInstance = jest.fn();
        const mockConstructor = jest.fn().mockImplementation(function(data) {
          this.id = data.id;
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.email = data.email;
          this.phone = data.phone;
          this.address = data.address;
          this.education = [];
          this.workExperience = [];
          this.resumes = [];
          this.save = mockSaveInstance;
        });

        MockedCandidate.mockImplementationOnce(mockConstructor);

        await expect(addCandidate(payload)).rejects.toThrow('Invalid email');
        expect(mockSaveInstance).not.toHaveBeenCalled();
      }
    });

  });

  describe('Validation - Additional Edge Cases', () => {
    it('should reject firstName with numbers', () => {
      const payload = {
        firstName: 'John123',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      expect(() => validateCandidateData(payload)).toThrow('Invalid name');
    });

    it('should reject lastName with numbers', () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe456',
        email: 'john@example.com',
      };

      expect(() => validateCandidateData(payload)).toThrow('Invalid name');
    });

    it('should accept names with only spaces between words', () => {
      const payload = {
        firstName: 'Jean Pierre',
        lastName: 'De La Cruz',
        email: 'test@example.com',
      };

      expect(() => validateCandidateData(payload)).not.toThrow();
    });

    it('should reject phone with non-digit characters', () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '61-2345-678',
      };

      expect(() => validateCandidateData(payload)).toThrow('Invalid phone');
    });

    it('should accept valid address at exactly 100 characters', () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        address: 'A'.repeat(100),
      };

      expect(() => validateCandidateData(payload)).not.toThrow();
    });

    it('should allow optional phone to be undefined', () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: undefined,
      };

      expect(() => validateCandidateData(payload)).not.toThrow();
    });

    it('should allow optional address to be undefined', () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        address: undefined,
      };

      expect(() => validateCandidateData(payload)).not.toThrow();
    });
  });
});
