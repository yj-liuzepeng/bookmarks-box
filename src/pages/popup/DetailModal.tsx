import React, { useEffect, useState, useRef } from 'react';
import { Modal, Select, Input } from '@douyinfe/semi-ui';
interface BookItem {
  id: string;
  parentId: string;
  index: number;
  title: string;
  dateGroupModified: number;
  dateAdded: number;
  children: BookItem[]
}
interface IProps {
  show: boolean
  data: BookItem
  save: (parentId: string | undefined, title: string | undefined, url: string | undefined) => void
  cancel: () => void
}
const DetailModal: React.FC<IProps> = (props: IProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [fileData, setFileData] = useState([] as BookItem[]);
  const addtitleRef = useRef<HTMLInputElement>(null)
  const addurlRef = useRef<HTMLInputElement>(null)
  const [pid, setPid] = useState('');
  const { show, save, cancel, data } = props
  useEffect(() => {
    setIsModalOpen(show)
  }, [show])
  useEffect(() => {
    chrome.bookmarks.getTree((res: any) => {
      let markdata = res[0].children[0].children
      let fileData = getFile(markdata)
      setFileData(fileData)
    })

  }, [isModalOpen]);
  useEffect(() => {
    if (isModalOpen) {
      setPid('')
      chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        let title = tabs[0].title as string
        let url = tabs[0].url as string
        setTitle(title)
        setUrl(url)
      });
    }
  }, [isModalOpen])

  const selectFile = (value: any) => {
    setPid(value)
  }
  // 获取文件夹递归
  const getFile = (data: BookItem[]) => {
    function getNeed(ary: BookItem[]) {
      ary.forEach(item => {
        if (item.children) {
          res.push(item)
          getNeed(item.children)
        }
      });
    }
    let res: BookItem[] = []
    getNeed(data)
    return res
  }
  const handleOk = () => {
    save(pid, addtitleRef.current?.value, addurlRef.current?.value)
  };
  const handleCancel = () => {
    cancel()
  };

  return (
    <>
      <Modal
        title="添加网页"
        visible={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        className="detail-modal"
        okText={'保存'}
        cancelText={'取消'}
      >
        <div style={{ marginBottom: '15px' }}>
          <span style={{ paddingRight: '6px' }}>目录:</span>
          <Select filter style={{ width: 230 }} placeholder='请选择保存到' showClear disabled={!!data.id} defaultValue={data.id}  onChange={selectFile}>
            {fileData && fileData.map(item => {
              return <Select.Option value={item.id} key={item.id}>
                <img src="https://liuzepeng.com/folder.png" style={{ width: '15px', height: '15px',verticalAlign: 'middle' }} />{item.title}</Select.Option>
            })
            }
          </Select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <span style={{ paddingRight: '6px' }}>名称:</span>
          <Input ref={addtitleRef} style={{ width: 230 }} placeholder='请填写名称' key={title ? 1 : 2} defaultValue={title} showClear></Input>
        </div>
        <div>
          <span style={{ paddingRight: '6px' }}>网址:</span>
          <Input ref={addurlRef} style={{ width: 230 }} placeholder='请填写网址' key={url ? 1 : 2} defaultValue={url} showClear></Input>
        </div>
        {
          !data.id && <div className='no-url'>若不选目录，则默认添加到根目录</div>
        }
        
        <div className='no-url'>若不填网址，则默认新增目录</div>
      </Modal>
    </>
  );
};

export default DetailModal;