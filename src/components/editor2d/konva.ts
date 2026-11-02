// Register only the shapes used by the editor before React Konva constructs them.
import "konva/lib/shapes/Line";
import "konva/lib/shapes/Text";
import "konva/lib/shapes/Rect";
import "konva/lib/shapes/Circle";

export {
  Stage,
  Layer,
  Group,
  Line,
  Text,
  Rect,
  Circle,
} from "react-konva/lib/ReactKonvaCore";
