// Common Backend API Responses
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ErrorResponse {
  status: number;
  message: string;
  error: string;
  timestamp: string;
}

// Roles & Permissions
export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'ENTRENADOR' | 'RECEPCIONISTA' | 'CLIENTE' | (string & {});

export interface PermissionResponse {
  id: number;
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface CreatePermissionRequest {
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface UpdatePermissionRequest {
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface RoleResponse {
  id: number;
  name: RoleName;
  description: string;
  systemRole: boolean;
  permissions: PermissionResponse[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface AssignRolePermissionsRequest {
  permissionIds: number[];
}

// User types
export interface UserResponse {
  id: string; // UUID
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  username: string;
  roleId?: number;
  roleName: RoleName;
  permissions?: string[];
  branchId?: number;
  active: boolean;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  username: string;
  role?: string;
  roleId?: number;
  branchId?: number;
  hireDate?: string; // YYYY-MM-DD
}

export interface CreateUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  username: string;
  role: string;
  branchId?: number;
  hireDate?: string;
  active: boolean;
  temporaryPassword?: string;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  username: string;
  branchId?: number;
  roleId?: number;
  active?: boolean;
}

// Member types
export interface MemberResponse {
  id: string; // UUID
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  username: string;
  roleName: RoleName;
  branchId?: number;
  registrationDate?: string;
  active: boolean;
}

export interface CreateMemberRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  username: string;
  branchId?: number;
}

export interface CreateMemberResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  username: string;
  role: string;
  branchId?: number;
  registrationDate?: string;
  active: boolean;
  temporaryPassword?: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface MeResponse {
  username: string;
  subject: string;
  groups: string[];
  role?: RoleName;
  permissions?: string[];
  name?: string;
  email?: string;
}

// Membership enums & types
export type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'FROZEN' | 'CANCELLED' | 'EXPIRED';

export interface BenefitResponse {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface CreateBenefitRequest {
  name: string;
  description?: string;
}

export interface UpdateBenefitRequest {
  name: string;
  description?: string;
}

export interface MembershipPlanResponse {
  id: number;
  name: string;
  duration: number; // in days
  price: number;
  description?: string;
  benefits: BenefitResponse[];
  createdAt?: string;
}

export interface CreateMembershipPlanRequest {
  name: string;
  duration: number;
  price: number;
  description?: string;
  benefitIds?: number[];
}

export interface UpdateMembershipPlanRequest {
  name: string;
  duration: number;
  price: number;
  description?: string;
}

export interface PlanPriceHistoryResponse {
  id: number;
  planId: number;
  price: number;
  startDate: string;
  endDate?: string;
}

export interface MembershipResponse {
  id: number;
  memberId: string;
  memberName: string;
  memberEmail: string;
  planId: number;
  planName: string;
  planDuration: number;
  planPrice: number;
  status: MembershipStatus;
  startDate: string;
  dueDate: string;
  createdAt: string;
}

export interface CreateMembershipRequest {
  memberId: string;
  planId: number;
  startDate?: string;
}

export interface ChangePlanRequest {
  newPlanId: number;
  reason?: string;
}

export interface CancelMembershipRequest {
  reason?: string;
}

export interface FreezeMembershipRequest {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface MembershipHistoryResponse {
  id: number;
  membershipId: number;
  previousStatus: MembershipStatus;
  newStatus: MembershipStatus;
  changeDate: string;
  observation?: string;
}

export interface MembershipFreezeResponse {
  id: number;
  membershipId: number;
  startDate: string;
  endDate: string;
  reason?: string;
  createdAt: string;
}

// Gym Classes enums & types
export type ClassStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type EnrollmentStatus = 'ENROLLED' | 'WAITLISTED' | 'CANCELLED' | 'ATTENDED';

export interface ClassTypeResponse {
  id: number;
  name: string;
  description?: string;
}

export interface CreateClassTypeRequest {
  name: string;
  description?: string;
}

export interface UpdateClassTypeRequest {
  name: string;
  description?: string;
}

export interface ClassResponse {
  id: number;
  branchId: number;
  branchName: string;
  classTypeId: number;
  classTypeName: string;
  trainerId: string;
  trainerName: string;
  status: ClassStatus;
  schedule: string;
  duration: number;
  maxCapacity: number;
  enrolledCount: number;
  availableSpots: number;
  waitlistCount: number;
  averageRating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassRequest {
  branchId: number;
  classTypeId: number;
  trainerId: string;
  schedule: string; // ISO Instant string
  duration: number;
  maxCapacity: number;
}

export interface UpdateClassRequest {
  branchId?: number;
  classTypeId?: number;
  trainerId?: string;
  schedule?: string;
  duration?: number;
  maxCapacity?: number;
  status?: ClassStatus;
}

export interface ClassEnrollmentResponse {
  id: number;
  classId: number;
  classTypeName: string;
  classSchedule: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  status: EnrollmentStatus;
  enrollmentDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEnrollmentRequest {
  classId: number;
  memberId?: string;
}

export interface WaitlistResponse {
  id: number;
  classId: number;
  classTypeName: string;
  classSchedule: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  registrationDate: string;
  notified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ClassRatingResponse {
  id: number;
  enrollmentId: number;
  classId: number;
  classTypeName: string;
  memberId: string;
  memberName: string;
  rating: number; // 1-5
  comment?: string;
  dateTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassRatingRequest {
  enrollmentId: number;
  rating: number;
  comment?: string;
}

// Attendance
export interface AttendanceResponse {
  id: number;
  branchId: number;
  branchName: string;
  receptionistId?: string;
  receptionistName?: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  date: string;
  entryTime: string;
  exitTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAttendanceRequest {
  branchId: number;
  memberId: string;
  receptionistId?: string;
  date?: string;
  entryTime?: string;
  exitTime?: string;
}

export interface UpdateAttendanceExitRequest {
  exitTime?: string;
}

// Invoices & Payments
export type InvoiceStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'REFUNDED';

export interface InvoiceResponse {
  id: number;
  branchId: number;
  branchName: string;
  membershipId: number;
  memberId: string;
  memberName: string;
  memberEmail: string;
  planId?: number;
  planName?: string;
  receptionistId?: string;
  receptionistName?: string;
  status: InvoiceStatus;
  promotionId?: number;
  promotionName?: string;
  originalAmount?: number;
  discountAmount?: number;
  amount: number;
  amountPaid: number;
  balanceDue: number;
  issueDate: string;
  dueDate: string;
  observation?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateInvoiceRequest {
  membershipId: number;
  branchId: number;
  receptionistId?: string;
  promotionId?: number;
  amount: number;
  issueDate?: string;
  dueDate?: string;
  observation?: string;
}

export interface PaymentReceiptResponse {
  id: number;
  invoiceId: number;
  paymentMethodId: number;
  paymentMethodName: string;
  paymentDate: string;
  amountPaid: number;
  reference?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePaymentReceiptRequest {
  invoiceId: number;
  paymentMethodId: number;
  amountPaid: number;
  reference?: string;
  paymentDate?: string;
}

export interface PaymentMethodResponse {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentMethodRequest {
  name: string;
  description?: string;
}

export interface UpdatePaymentMethodRequest {
  name: string;
  description?: string;
}

// Promotions
export type PromotionDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface PromotionResponse {
  id: number;
  name: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt?: string;
}

export interface CreatePromotionRequest {
  name: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  active?: boolean;
}

export interface UpdatePromotionRequest {
  name: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  active?: boolean;
}

// Branches helper (from seeds)
export interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  active?: boolean;
}

export interface BranchResponse {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  active: boolean;
  createdAt?: string;
}

export interface CreateBranchRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  active?: boolean;
}

export interface UpdateBranchRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  active?: boolean;
}

export interface ReceptionistResponse {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  branchId: number;
  branchName?: string;
  hireDate?: string;
  shift?: string;
  active: boolean;
  createdAt?: string;
}

export interface CreateReceptionistRequest {
  userId: string;
  branchId: number;
  hireDate?: string;
  shift?: string;
}

export interface UpdateReceptionistRequest {
  branchId?: number;
  hireDate?: string;
  shift?: string;
  active?: boolean;
}

export interface TrainerResponse {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  branchId?: number;
  branchName?: string;
  bio?: string;
  hireDate?: string;
  active: boolean;
  createdAt?: string;
  specializationIds?: number[];
  specializationNames?: string[];
}

export interface CreateTrainerRequest {
  userId: string;
  branchId?: number;
  bio?: string;
  hireDate?: string;
  specializationIds?: number[];
}

export interface UpdateTrainerRequest {
  branchId?: number;
  bio?: string;
  hireDate?: string;
  active?: boolean;
  specializationIds?: number[];
}

export interface SpecializationResponse {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface CreateSpecializationRequest {
  name: string;
  description?: string;
}

export interface UpdateSpecializationRequest {
  name?: string;
  description?: string;
}

export interface TrainerSpecializationResponse {
  trainerId: string;
  specializationId: number;
  specializationName?: string;
  assignedAt?: string;
}

export interface AssignTrainerSpecializationRequest {
  trainerId: string;
  specializationId: number;
}

export interface TrainerAssignmentResponse {
  id: number;
  trainerId: string;
  trainerName?: string;
  memberId: string;
  memberName?: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  notes?: string;
  createdAt?: string;
}

export interface CreateTrainerAssignmentRequest {
  trainerId: string;
  memberId: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface UpdateTrainerAssignmentRequest {
  startDate?: string;
  endDate?: string;
  active?: boolean;
  notes?: string;
}

export interface ExerciseResponse {
  id: number;
  name: string;
  description?: string;
  muscleGroup: string;
  equipment?: string;
  difficulty?: string;
  videoUrl?: string;
  active: boolean;
  createdAt?: string;
}

export interface CreateExerciseRequest {
  name: string;
  description?: string;
  muscleGroup: string;
  equipment?: string;
  difficulty?: string;
  videoUrl?: string;
  active?: boolean;
}

export interface UpdateExerciseRequest {
  name?: string;
  description?: string;
  muscleGroup?: string;
  equipment?: string;
  difficulty?: string;
  videoUrl?: string;
  active?: boolean;
}

export interface RoutineExerciseResponse {
  id: number;
  routineId: number;
  routineName?: string;
  exerciseId: number;
  exerciseName?: string;
  muscleGroup?: string;
  trainingDay?: string;
  sets: number;
  repetitions?: number;
  restSeconds?: number;
  notes?: string;
  orderIndex?: number;
}

export interface AddRoutineExerciseRequest {
  exerciseId: number;
  trainingDay?: string;
  sets: number;
  repetitions?: number;
  restSeconds?: number;
  weight?: number;
  notes?: string;
  orderIndex?: number;
}

export interface RoutineResponse {
  id: number;
  assignmentId?: number;
  trainerId?: string;
  trainerName?: string;
  memberId?: string;
  memberName?: string;
  name: string;
  description?: string;
  goal?: string;
  difficultyLevel?: string;
  active: boolean;
  createdAt?: string;
  exercises?: RoutineExerciseResponse[];
}

export interface CreateRoutineRequest {
  assignmentId?: number;
  trainerId?: string;
  memberId?: string;
  name: string;
  description?: string;
  goal?: string;
  difficultyLevel?: string;
  active?: boolean;
}

export interface UpdateRoutineRequest {
  assignmentId?: number;
  trainerId?: string;
  memberId?: string;
  name?: string;
  description?: string;
  goal?: string;
  difficultyLevel?: string;
  active?: boolean;
}

export interface WorkoutLogResponse {
  id: number;
  memberId: string;
  memberName?: string;
  routineId?: number;
  routineName?: string;
  routineExerciseId?: number;
  exerciseId: number;
  exerciseName?: string;
  logDate: string;
  setsCompleted: number;
  repsCompleted: number;
  weightUsed?: number;
  perceivedEffort?: number;
  notes?: string;
  createdAt?: string;
}

export interface CreateWorkoutLogRequest {
  memberId: string;
  routineId?: number;
  routineExerciseId?: number;
  exerciseId: number;
  logDate?: string;
  setsCompleted: number;
  repsCompleted: number;
  weightUsed?: number;
  perceivedEffort?: number;
  notes?: string;
}

export interface UpdateWorkoutLogRequest {
  logDate?: string;
  setsCompleted?: number;
  repsCompleted?: number;
  weightUsed?: number;
  perceivedEffort?: number;
  notes?: string;
}

export interface GoalResponse {
  id: number;
  name: string;
  description?: string;
  category?: string;
  active: boolean;
  createdAt?: string;
}

export interface CreateGoalRequest {
  name: string;
  description?: string;
  category?: string;
  active?: boolean;
}

export interface UpdateGoalRequest {
  name?: string;
  description?: string;
  category?: string;
  active?: boolean;
}

export interface MemberGoalResponse {
  id: number;
  memberId: string;
  memberName?: string;
  goalId: number;
  goalName?: string;
  targetDate?: string;
  status: string;
  targetValue?: number;
  currentValue?: number;
  notes?: string;
  createdAt?: string;
}

export interface AssignMemberGoalRequest {
  memberId: string;
  goalId: number;
  targetDate?: string;
  status?: string;
  targetValue?: number;
  currentValue?: number;
  notes?: string;
}

export interface UpdateMemberGoalRequest {
  targetDate?: string;
  status?: string;
  targetValue?: number;
  currentValue?: number;
  notes?: string;
}

export interface PhysicalMeasurementResponse {
  id: number;
  memberId: string;
  memberName?: string;
  measuredByTrainerId?: string;
  trainerName?: string;
  measurementDate: string;
  weightKg?: number;
  heightCm?: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
  createdAt?: string;
}

export interface CreatePhysicalMeasurementRequest {
  memberId: string;
  measuredByTrainerId?: string;
  measurementDate?: string;
  weightKg?: number;
  heightCm?: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
}

export interface UpdatePhysicalMeasurementRequest {
  measuredByTrainerId?: string;
  measurementDate?: string;
  weightKg?: number;
  heightCm?: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
}
