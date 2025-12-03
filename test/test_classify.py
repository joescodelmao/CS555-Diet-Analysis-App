import pytest
from unittest.mock import MagicMock, patch
from PIL import Image

# Note that these tests use pillow and preset probabilities to test model function and connection. 
# Actually running the model would take too much CPU/GPU power, so it only tests if the mock predictions are correct.

def classify_image(model, image_path):
    image = Image.open(image_path)
    return model.classify(image)

mock_predictions = [
    {"className": "banana", "probability": 0.95},
    {"className": "apple", "probability": 0.04},
]

@patch("PIL.Image.open")
def test_classify_image(mock_open):
    mock_image = MagicMock()
    mock_open.return_value = mock_image

    mock_model = MagicMock()
    mock_model.classify.return_value = mock_predictions

    result = classify_image(mock_model, "dummy_path.jpg")

    assert result == mock_predictions
    mock_model.classify.assert_called_once_with(mock_image)
    mock_open.assert_called_once_with("dummy_path.jpg")

@patch("PIL.Image.open")
def test_classify_image_model_error(mock_open):
    mock_image = MagicMock()
    mock_open.return_value = mock_image

    mock_model = MagicMock()
    mock_model.classify.side_effect = Exception("TensorFlow crashed")

    with pytest.raises(Exception) as exc_info:
        classify_image(mock_model, "dummy_path.jpg")

    assert "TensorFlow crashed" in str(exc_info.value)

@patch("PIL.Image.open", side_effect=FileNotFoundError)
def test_classify_image_file_not_found(mock_open):
    mock_model = MagicMock()
    with pytest.raises(FileNotFoundError):
        classify_image(mock_model, "no_such_file.jpg")