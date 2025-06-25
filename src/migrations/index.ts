import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../config/database';

const umzug = new Umzug({
  migrations: {
    glob: ['*.migration.{js,ts}', { cwd: __dirname }],
    resolve: ({ name, path: migrationPath, context }) => {
      if (!migrationPath) {
        throw new Error(`Migration path is undefined for ${name}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const migration = require(migrationPath);
      return {
        name,
        up: async () => migration.up(context),
        down: async () => migration.down(context),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

export const runMigrations = async (): Promise<void> => {
  await umzug.up();
  console.log('Migrations executed successfully');

  await sequelize.query(`DELETE FROM users`);
  await sequelize.query(
    `INSERT INTO users (id, balance) 
         VALUES (:id, :balance)`,
    {
      replacements: {
        id: 1,
        balance: 10000,
      },
      type: 'INSERT',
    },
  );
 
};

export { umzug };
