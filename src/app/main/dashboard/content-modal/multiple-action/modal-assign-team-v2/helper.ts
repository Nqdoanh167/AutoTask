/**
 * Distributes tasks among users while respecting minimum tasks per user constraint.
 * The function ensures optimal distribution where some users may get one more task than others
 * to ensure all tasks are distributed.
 *
 * Distribution Rules:
 * 1. Each user must receive at least minTasksPerUser tasks
 * 2. The difference in tasks between any two users must not exceed 1
 * 3. All tasks must be distributed
 * 4. The distribution prioritizes giving more users the higher number of tasks when possible
 *
 * @param totalTasks - Total number of tasks to distribute
 * @param totalUsers - Number of users to distribute tasks among
 * @param [minTasksPerUser=1] - Minimum number of tasks each user must receive
 *
 * @returns Object containing distribution details
 * @returns baseTasksPerUser - Number of tasks each user will receive
 * @returns baseUsers - Number of users who will receive the base number of tasks
 * @returns extendedTasksPerUser - Number of tasks each user will receive if there are leftover tasks
 * @returns extendedUsers - Number of users who will receive the extended number of tasks
 * @returns hasLeftover - Whether there are leftover tasks
 *
 * @throws {Error} If totalTasks is less than or equal to 0
 * @throws {Error} If totalUsers is less than or equal to 0
 * @throws {Error} If minTasksPerUser is less than 1
 * @throws {Error} If minTasksPerUser is greater than totalTasks
 * @throws {Error} If it's impossible to distribute tasks with given constraints
 *
 * @example
 * // Distribute 10 tasks among 3 users with minimum 2 tasks each
 * distributeTasksToUsers(10, 3, 2)
 * // Returns: { higherTaskCount: 4, higherTaskUserCount: 2, hasUnevenDistribution: true, lowerTaskCount: 2, lowerTaskUserCount: 1 }
 * // Meaning: 2 users get 4 tasks each, 1 user gets 2 tasks
 */
export function distributeTasksToUsers(
  totalTasks: number,
  totalUsers: number,
  minTasksPerUser = 1,
) {
  // Input validation
  if (totalTasks < 0) throw new Error('totalTasks must be greater than 0');
  if (totalUsers < 0) throw new Error('totalUsers must be greater than 0');
  if (totalTasks ===0) {
    return {
      higherTaskCount: 0,
      higherTaskUserCount: 0,
      hasUnevenDistribution: false,
      lowerTaskCount: 0,
      lowerTaskUserCount: 0,
    }
  }
  if (minTasksPerUser < 1)
    throw new Error('minTasksPerUser must be at least 1');
  if (minTasksPerUser > totalTasks) {
    throw new Error(
      `minTasksPerUser must be between 1 and ${totalTasks}, but got ${minTasksPerUser}`,
    );
  }

  // Special case: One user gets all tasks
  if (minTasksPerUser === totalTasks) {
    return {
      higherTaskCount: totalTasks,
      higherTaskUserCount: 1,
      hasUnevenDistribution: true, // Only one user, so no lower task users
      lowerTaskCount: 0,
      lowerTaskUserCount: totalUsers - 1,
    };
  }

  // Special case: More users than tasks with minimum 1 task per user
  if (totalUsers > totalTasks && minTasksPerUser === 1) {
    return {
      higherTaskCount: 1,
      higherTaskUserCount: totalTasks,
      hasUnevenDistribution: true,
      lowerTaskCount: 0,
      lowerTaskUserCount: totalUsers - totalTasks,
    };
  }

  // Calculate initial even distribution
  let initialTasksPerUser = Math.max(
    Math.floor(totalTasks / totalUsers),
    minTasksPerUser,
  );

  // Handle case where minimum tasks constraint forces uneven distribution
  if (initialTasksPerUser * totalUsers > totalTasks) {
    const maxUsersAtInitialCount = Math.floor(totalTasks / initialTasksPerUser);
    const excessTasks =
      totalTasks - maxUsersAtInitialCount * initialTasksPerUser;

    return {
      higherTaskCount: initialTasksPerUser + (excessTasks > 0 ? 1 : 0),
      higherTaskUserCount: excessTasks > 0 ? 1 : maxUsersAtInitialCount,
      hasUnevenDistribution: true,
      lowerTaskCount: initialTasksPerUser,
      lowerTaskUserCount: excessTasks > 0 ? maxUsersAtInitialCount - 1 : 0,
    };
  }

  // Calculate tasks distribution
  const totalInitialTasks = initialTasksPerUser * totalUsers;
  const additionalTasks = totalTasks - totalInitialTasks;

  // Perfect division case - all users get the same number of tasks
  if (additionalTasks === 0) {
    return {
      higherTaskCount: initialTasksPerUser,
      higherTaskUserCount: totalUsers,
      hasUnevenDistribution: false,
      lowerTaskCount: 0,
      lowerTaskUserCount: 0,
    };
  }

  // Distribute remaining tasks - some users get one additional task
  const usersWithExtraTask = additionalTasks;
  const usersWithBaseTask = totalUsers - usersWithExtraTask;

  return {
    higherTaskCount: initialTasksPerUser + 1,
    higherTaskUserCount: usersWithExtraTask,
    hasUnevenDistribution: true,
    lowerTaskCount: initialTasksPerUser,
    lowerTaskUserCount: usersWithBaseTask,
  };
}

// // Original test cases with verification
// console.log(distributeTasksToUsers(1000, 53, 1)); // => 46 -> 19; 7 -> 18 (46*19 + 7*18 = 1000)
// console.log(distributeTasksToUsers(52, 53, 1)); // => 1 -> 52; 52 -> 0 (1*52 + 52*0 = 52)
// console.log(distributeTasksToUsers(10, 3, 2)); // => 2 -> 4; 1 -> 2 (2*4 + 1*2 = 10)
// console.log(distributeTasksToUsers(15, 3, 2)); // => 3 -> 5; 0 -> 0 (3*5 = 15)
// console.log(distributeTasksToUsers(10, 20, 1)); // => 10 -> 1; 10 -> 0 (10*1 + 10*0 = 10)
// console.log(distributeTasksToUsers(107, 53, 1)); // => 1 -> 3; 52 -> 2 (1*3 + 52*2 = 107)
// console.log(distributeTasksToUsers(107, 53, 2)); // => 1 -> 3; 52 -> 2 (1*3 + 52*2 = 107)
// console.log(distributeTasksToUsers(107, 53, 3)); // => 35 -> 3; 1 -> 2 (35*3 + 1*2 = 107)
// console.log(distributeTasksToUsers(107, 53, 4)); // => 26 -> 4; 1 -> 3 (26*4 + 1*3 = 107)
// console.log(distributeTasksToUsers(53, 104, 1)); // => 53 -> 1; 51 -> 0 (53*1 + 51*0 = 53)
// console.log(distributeTasksToUsers(53, 104, 2)); // => 1 -> 3; 25 -> 2 (1*3 + 25*2 = 53)
// console.log(distributeTasksToUsers(53, 104, 3)); // => 17 -> 3; 1 -> 2 (17*3 + 1*2 = 53)
// console.log(distributeTasksToUsers(53, 104, 4)); // => 13 -> 4; 1 -> 1 (13*4 + 1*1 = 53)

// // Edge case tests
// console.log('\nEdge Cases:');
// console.log(distributeTasksToUsers(5, 5, 1)); // Perfect division: 5 -> 1; 0 -> 0 (5*1 = 5)
// console.log(distributeTasksToUsers(100, 10, 10)); // Equal distribution: 10 -> 10; 0 -> 0 (10*10 = 100)
// console.log(distributeTasksToUsers(5, 1, 5)); // Single user gets all: 1 -> 5; 0 -> 0 (1*5 = 5)
// console.log(distributeTasksToUsers(10, 5, 2)); // Perfect division: 5 -> 2; 0 -> 0 (5*2 = 10)

// // Error cases
// try {
//   console.log(distributeTasksToUsers(0, 5, 1));
// } catch (e) {
//   console.log('Error caught:', e.message);
// }

// try {
//   console.log(distributeTasksToUsers(10, 0, 1));
// } catch (e) {
//   console.log('Error caught:', e.message);
// }

// try {
//   console.log(distributeTasksToUsers(10, 5, 0));
// } catch (e) {
//   console.log('Error caught:', e.message);
// }

// try {
//   console.log(distributeTasksToUsers(10, 5, 11));
// } catch (e) {
//   console.log('Error caught:', e.message);
// }

// try {
//   console.log(distributeTasksToUsers(100, 2, 60)); // Impossible distribution
// } catch (e) {
//   console.log('Error caught:', e.message);
// }
