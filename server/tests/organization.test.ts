import { isCircularReporting } from '../src/services/organizationService';
import Employee from '../src/models/Employee';

jest.mock('../src/models/Employee');

describe('Organization Service - Hierarchy Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should flag circular reporting if employeeId matches managerId (self-reporting)', async () => {
    const isCircular = await isCircularReporting('EMP_001', 'EMP_001');
    expect(isCircular).toBe(true);
  });

  it('should flag circular reporting when manager reports to employee directly', async () => {
    // Mock Employee.findById to return manager chain upwards
    // When look up EMP_MGR (prospective manager), it reports to EMP_001 (employee)
    (Employee.findById as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        _id: 'EMP_MGR',
        reportingManager: 'EMP_001',
      })
    });

    const isCircular = await isCircularReporting('EMP_001', 'EMP_MGR');
    expect(isCircular).toBe(true);
  });

  it('should flag circular reporting when manager reports to employee indirectly (multiple levels)', async () => {
    // When looking up EMP_MGR (prospective manager), reports to EMP_MID
    (Employee.findById as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        _id: 'EMP_MGR',
        reportingManager: 'EMP_MID',
      })
    });
    // When looking up EMP_MID, reports to EMP_001
    (Employee.findById as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        _id: 'EMP_MID',
        reportingManager: 'EMP_001',
      })
    });

    const isCircular = await isCircularReporting('EMP_001', 'EMP_MGR');
    expect(isCircular).toBe(true);
  });

  it('should pass circular reporting check if chain has no loops', async () => {
    // When looking up EMP_MGR, reports to EMP_BOSS
    (Employee.findById as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        _id: 'EMP_MGR',
        reportingManager: 'EMP_BOSS',
      })
    });
    // When looking up EMP_BOSS, reports to null (top-level)
    (Employee.findById as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        _id: 'EMP_BOSS',
        reportingManager: null,
      })
    });

    const isCircular = await isCircularReporting('EMP_001', 'EMP_MGR');
    expect(isCircular).toBe(false);
  });
});
