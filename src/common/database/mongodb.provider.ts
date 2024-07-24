import { MongooseModule } from '@nestjs/mongoose';

export const DatabaseModule = MongooseModule.forRoot(
  `mongodb+srv://v-verse-ts:5pqznXVmGmYOl0Hw@v-verse-ts.24whdfe.mongodb.net/game-server`,
);
