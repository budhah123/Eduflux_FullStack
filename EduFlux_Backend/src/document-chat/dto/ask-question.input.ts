import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class AskQuestionInput {
  @ApiProperty({
    description: 'Question to ask about the document',
    example: 'What is the main topic of chapter 2?',
  })
  @IsString()
  @IsNotEmpty
  ()
  question: string;
}
