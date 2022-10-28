import React, { useEffect, useState, useRef } from 'react';
import { Modal, Input } from '@douyinfe/semi-ui';
interface BookItem {
  id: string;
  parentId: string;
  index: number;
  title: string;
  url?: string;
  dateGroupModified: number;
  dateAdded: number;
  children: BookItem[]
}
interface IProps {
  show: boolean
  data: BookItem
  save: (title: string | undefined, url: string | undefined) => void
  cancel: () => void
}


const EditModal: React.FC<IProps> = (props: IProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { show, data, save, cancel } = props
  const titleRef = useRef<HTMLInputElement>(null)
  const urlRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    setIsModalOpen(show)
  }, [show])


  const handleOk = () => {
    save(titleRef.current?.value, urlRef.current?.value)
  };
  const handleCancel = () => {
    cancel()
  };

  return (
    <>
      <Modal
        title="修改"
        visible={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        className="detail-modal"
        okText={'保存'}
        cancelText={'取消'}
      >
        <div style={{ marginBottom: '15px' }}>
          <span style={{ paddingRight: '6px' }}>名称:</span><Input ref={titleRef} style={{ width: 225 }} placeholder='书签名称' defaultValue={data?.title} showClear></Input>
        </div>
        {data?.url &&
          <div>
            <span style={{ paddingRight: '6px' }}>地址:</span><Input ref={urlRef} style={{ width: 225 }} placeholder='书签地址' defaultValue={data?.url} showClear></Input>
          </div>
        }
      </Modal>
    </>
  );
};

export default EditModal;