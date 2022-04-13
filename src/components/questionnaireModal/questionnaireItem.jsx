import React from 'react';
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';

// services & config
import questionnaireAnalyzer from '~services/questionnaireAnalyzer';

// custom input components for the different types of questions
import BasicInput from './input/basicInput';
import BooleanInput from './input/booleanInput';
import ChoicesInput from './input/choicesInput';
import DateInput from './input/dateInput';
import SliderInput from './input/sliderInput';

// shared styles & style calculations
import SharedStyles, {
  calculateFontSize,
  calculateIndent,
  calculateLineHeight,
} from './input/sharedStyles';

/***********************************************************************************************
 * component:
 * renders a single FHIR-Questionnaire Item
 * should this item be oif type group, its child items are rendered recursively
 *
 * @param {object} props
 * @param {QuestionnaireItem} props.item the item to be rendered
 **********************************************************************************************/
export default function QuestionnaireItem({ item }) {
  const questionnaireItemMap = useSelector(
    (state) => state.Questionnaire.itemMap,
  );

  // only render the item if its requirements (i.e. the "enableWhen" constraints) are met
  if (
    !questionnaireAnalyzer.checkDependenciesOfSingleItem(
      item,
      questionnaireItemMap,
    )
  ) {
    return null;
  }
  // if the item represents a group of questions, display the title of the group and render the children below
  if (item.type === 'group') {
    return (
      <View key={item.linkId}>
        <Text
          style={{
            ...SharedStyles.contentTitle,
            fontSize: calculateFontSize(item.linkId),
            lineHeight: calculateLineHeight(item.linkId),
            marginLeft: calculateIndent(item.linkId),
          }}
        >
          {item.text}
        </Text>
        {item.item &&
          item.item.map((subItem) => (
            <QuestionnaireItem item={subItem} key={subItem.linkId} />
          ))}
      </View>
    );
  } else {
    let itemControlExtension;
    let isSlider;
    switch (item.type) {
      // creates regular inputs for strings
      case 'string':
        return <BasicInput item={item} key={item.linkId} />;

      // creates either a list of radio buttons, a list of checkboxes or a drop-down element
      case 'choice':
        return <ChoicesInput item={item} key={item.linkId} />;

      // creates a checkbox
      case 'boolean':
        return <BooleanInput item={item} key={item.linkId} />;

      // creates a date input
      case 'date':
        return <DateInput item={item} key={item.linkId} />;

      // creates the inputs for decimals and integers (and numerical sliders)
      // this also utilizes the decimal-pad or the num-pad
      case 'integer':
      case 'decimal':
        itemControlExtension = item.extension?.find(
          (e) =>
            e.url ===
            'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
        );
        isSlider = itemControlExtension?.valueCodeableConcept?.coding?.find(
          (c) =>
            c.system === 'http://hl7.org/fhir/questionnaire-item-control' &&
            c.code === 'slider',
        );
        return isSlider ? (
          <SliderInput item={item} key={item.linkId} />
        ) : (
          <BasicInput item={item} key={item.linkId} />
        );

      // if nothing else matches - display the title
      default:
        return (
          <Text
            style={{
              ...SharedStyles.contentTitle,
              fontSize: calculateFontSize(item.linkId),
              lineHeight: calculateLineHeight(item.linkId),
              marginLeft: calculateIndent(item.linkId),
            }}
          >
            {item.text}
          </Text>
        );
    }
  }
}
