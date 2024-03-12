var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Schema, type } from "@colyseus/schema";
export class MyRoomState extends Schema {
    mySynchronizedProperty = "Hello world";
}
__decorate([
    type("string")
], MyRoomState.prototype, "mySynchronizedProperty", void 0);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlSb29tU3RhdGUuanMiLCJzb3VyY2VSb290IjoiL1VzZXJzL2ZyZWUvY29kZS9mcmVlY29uLWZyb250aWVyL2ZyZWVjb24tZnJvbnRpZXItZnJvbnRlbmQvIiwic291cmNlcyI6WyJzcmMvY29seXNldXMvcm9vbXMvc2NoZW1hL015Um9vbVN0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQVcsSUFBSSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFFekQsTUFBTSxPQUFPLFdBQVksU0FBUSxNQUFNO0lBRXJCLHNCQUFzQixHQUFXLGFBQWEsQ0FBQztDQUVoRTtBQUZpQjtJQUFmLElBQUksQ0FBQyxRQUFRLENBQUM7MkRBQWdEIn0=